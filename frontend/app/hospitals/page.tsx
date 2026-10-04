'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { useLanguage } from '@/lib/language-context';

interface Hospital {
  id: number;
  name: string;
  type: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  emergency: string;
  specialties: string[];
  distance_km?: number;
  lat: number;
  lng: number;
}

const TYPE_COLORS: Record<string, string> = {
  'Government/Apex': '#1f6f63',
  'Government': '#2563eb',
  'Teaching': '#7c3aed',
  'Private': '#b45309',
};

const TYPE_ICONS: Record<string, string> = {
  'Government/Apex': '🏛️',
  'Government': '🏥',
  'Teaching': '🎓',
  'Private': '🏨',
};

export default function HospitalsPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'found' | 'error'>('idle');
  const [radiusKm, setRadiusKm] = useState(50);
  const [searchMode, setSearchMode] = useState<'nearby' | 'search' | 'state'>('nearby');

  const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  const fetchNearby = useCallback(async (lat: number, lng: number, radius: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/v1/hospitals/nearby?lat=${lat}&lng=${lng}&radius_km=${radius}&limit=20`);
      const data = await res.json();
      setHospitals(data.hospitals || []);
    } catch {
      setLocationError('Failed to fetch hospitals. Please check the backend is running.');
    } finally {
      setIsLoading(false);
    }
  }, [BACKEND]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      setLocationStatus('error');
      return;
    }
    setLocationStatus('requesting');
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationStatus('found');
        setSearchMode('nearby');
        fetchNearby(latitude, longitude, radiusKm);
      },
      (err) => {
        setLocationStatus('error');
        if (err.code === 1) {
          setLocationError('Location access denied. Please allow location access or use search/state filter below.');
        } else {
          setLocationError('Could not get your location. Try searching by name or state below.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [fetchNearby, radiusKm]);

  // Auto-detect on mount
  useEffect(() => {
    detectLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setSearchMode('search');
    try {
      const res = await fetch(`${BACKEND}/api/v1/hospitals/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setHospitals(data.hospitals || []);
    } catch {
      setLocationError('Search failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStateFilter = async (state: string) => {
    setSelectedState(state);
    setSearchMode('state');
    setIsLoading(true);
    try {
      const url = state
        ? `${BACKEND}/api/v1/hospitals?state=${encodeURIComponent(state)}`
        : `${BACKEND}/api/v1/hospitals`;
      const res = await fetch(url);
      const data = await res.json();
      setHospitals(data.hospitals || []);
    } catch {
      setLocationError('Failed to load hospitals.');
    } finally {
      setIsLoading(false);
    }
  };

  const indiaStates = [
    'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat',
    'Haryana','Himachal Pradesh','J&K','Jharkhand','Karnataka','Kerala',
    'Madhya Pradesh','Maharashtra','Manipur','Mizoram','Odisha','Puducherry',
    'Punjab','Rajasthan','Tamil Nadu','Telangana','Uttar Pradesh','Uttarakhand',
    'West Bengal',
  ];

  return (
    <KioskWrapper showLanguageTag={false}>
      <div className="w-full max-w-5xl">
        {/* Header Card */}
        <div className="clinical-card rounded-[2rem] p-6 mb-5 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(31,111,99,0.14),transparent_60%)]" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[var(--pulse-teal)] flex items-center justify-center text-3xl text-white shadow-lg shadow-[rgba(31,111,99,0.22)]">
                🏥
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--text-muted)]">Med-Drishti</p>
                <h1 className="text-2xl md:text-3xl text-[var(--chart-ink)]">Nearby Hospitals</h1>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">Find hospitals near your location · All India</p>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="rounded-xl border border-[var(--line)] bg-[var(--glass-bg)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--glass-bg-strong)] transition-colors"
            >
              ← Back
            </button>
          </div>

          {/* Location Status Bar */}
          <div className="relative mt-5 rounded-xl p-3 flex items-center gap-3"
            style={{
              background: locationStatus === 'found'
                ? 'rgba(31,111,99,0.08)' : locationStatus === 'error'
                ? 'rgba(239,68,68,0.07)' : locationStatus === 'requesting'
                ? 'rgba(251,191,36,0.1)' : 'rgba(241,245,249,0.9)',
              border: `1px solid ${locationStatus === 'found' ? 'rgba(31,111,99,0.2)' : locationStatus === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(203,213,225,0.6)'}`,
            }}
          >
            <span className="text-xl">
              {locationStatus === 'found' ? '📍' : locationStatus === 'requesting' ? '⏳' : locationStatus === 'error' ? '⚠️' : '📍'}
            </span>
            <div className="flex-1 min-w-0">
              {locationStatus === 'found' && (
                <p className="text-sm font-semibold text-[var(--pulse-teal)]">
                  Location detected — showing hospitals within {radiusKm} km
                </p>
              )}
              {locationStatus === 'requesting' && (
                <p className="text-sm font-semibold text-amber-700">Detecting your location...</p>
              )}
              {locationStatus === 'error' && locationError && (
                <p className="text-sm font-semibold text-red-700">{locationError}</p>
              )}
              {locationStatus === 'idle' && (
                <p className="text-sm text-[var(--text-muted)]">Click to detect your location</p>
              )}
            </div>
            <button
              onClick={detectLocation}
              className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg text-white transition-colors"
              style={{ background: 'var(--pulse-teal)' }}
            >
              {locationStatus === 'requesting' ? '...' : '🔄 Refresh'}
            </button>
          </div>
        </div>

        {/* Google Maps Live Search Banner */}
        {locationStatus === 'found' && userLocation && (
          <div className="mb-5">
            <a
              href={`https://www.google.com/maps/search/first+aid+hospitals+clinics+near+me/@${userLocation.lat},${userLocation.lng},14z`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-4 w-full rounded-2xl p-4 transition-all"
              style={{
                background: 'linear-gradient(135deg, #e8f0fe 0%, #d2e3fc 100%)',
                border: '1px solid #aecbfa',
                boxShadow: '0 4px 12px rgba(26,115,232,0.1)'
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--glass-bg)] flex items-center justify-center shadow-sm">
                  <span className="text-2xl">🗺️</span>
                </div>
                <div>
                  <h3 className="text-[var(--chart-ink)] font-bold text-base m-0">Live Google Maps Search</h3>
                  <p className="text-blue-800 text-sm m-0 mt-0.5">Find all local clinics, first aid, and private hospitals near you instantly</p>
                </div>
              </div>
              <div className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl whitespace-nowrap shadow-md hover:bg-blue-700 transition">
                Open Maps ↗
              </div>
            </a>
          </div>
        )}

        {/* Search & Filter Row */}
        <div className="flex gap-3 mb-5 flex-wrap">
          {/* Text Search */}
          <div className="flex-1 min-w-[200px] flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name, city, specialty..."
              className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--glass-bg)] px-4 py-2.5 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--pulse-teal)] transition-colors"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-bold transition-colors"
              style={{ background: 'var(--pulse-teal)' }}
            >
              🔍 Search
            </button>
          </div>

          {/* State Filter */}
          <select
            value={selectedState}
            onChange={e => handleStateFilter(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-[var(--glass-bg)] px-3 py-2.5 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--pulse-teal)] transition-colors min-w-[150px]"
          >
            <option value="">All States</option>
            {indiaStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Radius (only for nearby) */}
          {locationStatus === 'found' && (
            <select
              value={radiusKm}
              onChange={e => {
                const r = Number(e.target.value);
                setRadiusKm(r);
                if (userLocation) fetchNearby(userLocation.lat, userLocation.lng, r);
              }}
              className="rounded-xl border border-[var(--line)] bg-[var(--glass-bg)] px-3 py-2.5 text-sm text-[var(--text-secondary)] outline-none focus:border-[var(--pulse-teal)] min-w-[120px]"
            >
              <option value={20}>Within 20 km</option>
              <option value={50}>Within 50 km</option>
              <option value={100}>Within 100 km</option>
              <option value={300}>Within 300 km</option>
              <option value={1000}>All India</option>
            </select>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-[var(--pulse-teal)] border-t-transparent animate-spin" />
            <p className="text-[var(--text-muted)] font-semibold">Finding hospitals...</p>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="clinical-card rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">🏥</p>
            <p className="font-semibold text-[var(--text-secondary)]">No hospitals found in this area.</p>
            <p className="text-sm text-slate-400 mt-1">Try increasing the radius or searching by state.</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {hospitals.map(h => (
              <div
                key={h.id}
                className="clinical-card rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{TYPE_ICONS[h.type] || '🏥'}</span>
                      <h2 className="text-base font-bold text-[var(--chart-ink)] leading-tight">{h.name}</h2>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{h.address}, {h.city}, {h.state}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {h.distance_km !== undefined && (
                      <span className="text-[11px] font-bold text-[var(--pulse-teal)] bg-[rgba(31,111,99,0.08)] px-2 py-0.5 rounded-full">
                        📍 {h.distance_km} km
                      </span>
                    )}
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                      style={{ background: TYPE_COLORS[h.type] || '#64748b' }}
                    >
                      {h.type}
                    </span>
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1.5">
                  {h.specialties.slice(0, 5).map(s => (
                    <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--glass-bg-strong)] text-[var(--text-secondary)] border border-[var(--line)]">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Contact buttons */}
                <div className="flex gap-2 pt-1 border-t border-[var(--line)]">
                  <a
                    href={`tel:${h.phone}`}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-[var(--pulse-teal)] bg-[rgba(31,111,99,0.07)] hover:bg-[rgba(31,111,99,0.13)] transition-colors"
                  >
                    📞 {h.phone}
                  </a>
                  {h.emergency && h.emergency !== h.phone && (
                    <a
                      href={`tel:${h.emergency}`}
                      className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      🚨 Emergency
                    </a>
                  )}
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(h.name + ' ' + h.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                  >
                    🗺️ Map
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {hospitals.length > 0 && (
          <p className="text-center text-xs text-slate-400 mt-4 pb-4">
            Showing {hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''} ·
            In an emergency call <strong>108</strong> immediately
          </p>
        )}
      </div>
    </KioskWrapper>
  );
}
