'use client';

import React, { useEffect, useState } from 'react';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { getTriageAlerts, reviewTriageAlert } from '@/lib/api';
import { BigButton } from '@/components/ui/BigButton';

export default function TriageDashboardPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTriageAlerts();
      setAlerts(data);
    } catch (err: any) {
      console.error('Triage alerts fetch error:', err);
      setError('Failed to fetch triage alerts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll every 10s for real-time triage updates
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReview = async (alertId: number, currentReviewedStatus: boolean) => {
    try {
      await reviewTriageAlert(alertId, !currentReviewedStatus);
      // Update state locally
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, reviewed: !currentReviewedStatus } : a))
      );
    } catch (err) {
      console.error('Failed to review alert:', err);
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    if (filterSeverity === 'all') return true;
    return alert.severity.toLowerCase() === filterSeverity.toLowerCase();
  });

  const unreviewedCount = alerts.filter((a) => !a.reviewed).length;
  const criticalCount = alerts.filter((a) => a.severity.toLowerCase() === 'critical' && !a.reviewed).length;

  return (
    <KioskWrapper showLanguageTag={false}>
      <div className="w-full max-w-4xl flex flex-col gap-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-lg">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-red-100 text-red-700 font-extrabold text-xs rounded-full uppercase">
                Triage Nurse Dashboard
              </span>
              <span className="text-xs text-slate-400 font-medium">Realtime Monitor</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Active Triage Red Flag Alerts
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <span className="text-sm font-extrabold text-red-900">
                {criticalCount} CRITICAL
              </span>
            </div>
            <div className="px-4 py-2 bg-slate-100 rounded-2xl text-sm font-bold text-slate-700">
              {unreviewedCount} Pending Review
            </div>
          </div>
        </div>

        {/* Severity Filter Tabs */}
        <div className="flex gap-2 bg-slate-200/60 p-1.5 rounded-2xl w-fit">
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                filterSeverity === sev
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {loading && alerts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            Loading triage alerts...
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center flex flex-col items-center gap-3">
            <span className="text-4xl">✅</span>
            <p className="text-lg font-bold text-slate-700">No active red flags found</p>
            <p className="text-sm text-slate-400">All patient intake records are clear or reviewed.</p>
          </div>
        ) : (
          /* Alert Cards Feed */
          <div className="flex flex-col gap-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-6 rounded-3xl border shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                  alert.reviewed
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : alert.severity.toLowerCase() === 'critical'
                    ? 'bg-red-50/80 border-red-300 ring-2 ring-red-200'
                    : 'bg-amber-50/80 border-amber-300'
                }`}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                        alert.severity.toLowerCase() === 'critical'
                          ? 'bg-red-600 text-white'
                          : alert.severity.toLowerCase() === 'high'
                          ? 'bg-amber-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      {alert.severity}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      Rule: {alert.rule_id}
                    </span>
                    <span className="text-xs text-slate-400">
                      • Session #{alert.session_id}
                    </span>
                  </div>

                  <p className="text-base font-bold text-slate-900">
                    {alert.description}
                  </p>
                  <span className="text-xs text-slate-400">
                    Triggered at: {new Date(alert.triggered_at).toLocaleString()}
                  </span>
                </div>

                <BigButton
                  label={alert.reviewed ? '✓ Reviewed' : 'Mark Reviewed'}
                  onClick={() => handleReview(alert.id, alert.reviewed)}
                  variant={alert.reviewed ? 'secondary' : 'primary'}
                  className="text-xs min-h-[44px] py-2 px-4 whitespace-nowrap"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </KioskWrapper>
  );
}
