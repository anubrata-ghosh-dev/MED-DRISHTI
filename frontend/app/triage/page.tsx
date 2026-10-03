'use client';

import React, { useEffect, useState } from 'react';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { getTriageAlerts, reviewTriageAlert } from '@/lib/api';
import { BigButton } from '@/components/ui/BigButton';

const SEVERITY_CONFIG: Record<string, { bg: string; border: string; badge: string; badgeText: string; glow: string }> = {
  critical: {
    bg: 'rgba(196,67,46,0.06)',
    border: 'rgba(196,67,46,0.28)',
    badge: 'var(--alert-coral)',
    badgeText: 'white',
    glow: '0 0 0 2px rgba(196,67,46,0.20)',
  },
  high: {
    bg: 'rgba(216,154,61,0.06)',
    border: 'rgba(216,154,61,0.28)',
    badge: 'var(--vitals-amber)',
    badgeText: 'white',
    glow: '0 0 0 2px rgba(216,154,61,0.18)',
  },
  medium: {
    bg: 'rgba(31,111,99,0.05)',
    border: 'rgba(31,111,99,0.22)',
    badge: 'var(--pulse-teal)',
    badgeText: 'white',
    glow: '0 0 0 2px rgba(31,111,99,0.15)',
  },
  low: {
    bg: 'var(--glass-bg)',
    border: 'var(--glass-border)',
    badge: 'var(--text-muted)',
    badgeText: 'white',
    glow: 'none',
  },
};

export default function TriageDashboardPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const data = await getTriageAlerts();
      setAlerts(data);
    } catch (err: any) {
      console.error('Triage alerts fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReview = async (alertId: number, currentReviewedStatus: boolean) => {
    try {
      await reviewTriageAlert(alertId, !currentReviewedStatus);
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
  const criticalCount = alerts.filter(
    (a) => a.severity.toLowerCase() === 'critical' && !a.reviewed
  ).length;

  const severityFilters = ['all', 'critical', 'high', 'medium', 'low'];

  return (
    <KioskWrapper showLanguageTag={false}>
      <div className="w-full max-w-4xl flex flex-col gap-5">

        {/* ── Dashboard header card ── */}
        <div
          className="animate-fade-slide-up glass-card rounded-[1.75rem] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]"
                style={{
                  backgroundColor: 'rgba(196,67,46,0.12)',
                  color: 'var(--alert-coral)',
                }}
              >
                Triage Nurse Dashboard
              </span>
              <span
                className="flex items-center gap-1.5 text-xs font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ backgroundColor: '#22c55e' }}
                />
                Live
              </span>
            </div>
            <h2
              className="text-2xl font-black"
              style={{ color: 'var(--text-primary)' }}
            >
              Active Triage Alerts
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {criticalCount > 0 && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-2"
                style={{
                  backgroundColor: 'rgba(196,67,46,0.10)',
                  border: '1px solid rgba(196,67,46,0.24)',
                }}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: 'var(--alert-coral)', animation: 'pulse 1s ease-in-out infinite' }}
                />
                <span
                  className="text-sm font-extrabold"
                  style={{ color: 'var(--alert-coral)' }}
                >
                  {criticalCount} CRITICAL
                </span>
              </div>
            )}
            <div
              className="rounded-xl px-4 py-2 text-sm font-bold"
              style={{
                backgroundColor: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
              }}
            >
              {unreviewedCount} Pending
            </div>
          </div>
        </div>

        {/* ── Severity filter tabs ── */}
        <div
          className="animate-fade-slide-up delay-100 flex gap-1 rounded-2xl p-1 w-fit"
          style={{
            backgroundColor: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {severityFilters.map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-[0.08em] transition-all duration-150 capitalize focus:outline-none"
              style={{
                backgroundColor: filterSeverity === sev ? 'var(--glass-bg-strong)' : 'transparent',
                color: filterSeverity === sev ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: filterSeverity === sev ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* ── Alerts feed ── */}
        {loading && alerts.length === 0 ? (
          <div
            className="animate-fade-in glass-card rounded-[1.75rem] p-12 text-center"
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="animate-spin inline-block w-6 h-6 border-2 rounded-full mb-3" style={{ borderColor: 'var(--pulse-teal) transparent transparent transparent' }} />
            <p className="font-medium">Loading triage alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div
            className="animate-fade-in glass-card rounded-[1.75rem] p-12 text-center flex flex-col items-center gap-3"
          >
            <span className="text-4xl animate-float">✅</span>
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              No active red flags found
            </p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              All patient intake records are clear or reviewed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredAlerts.map((alert, i) => {
              const sevKey = alert.severity.toLowerCase() as keyof typeof SEVERITY_CONFIG;
              const cfg = SEVERITY_CONFIG[sevKey] ?? SEVERITY_CONFIG.low;

              return (
                <div
                  key={alert.id}
                  className="animate-fade-slide-up rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-200"
                  style={{
                    backgroundColor: alert.reviewed ? 'var(--glass-bg)' : cfg.bg,
                    border: `1px solid ${alert.reviewed ? 'var(--glass-border)' : cfg.border}`,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    boxShadow: alert.reviewed ? 'none' : cfg.glow,
                    opacity: alert.reviewed ? 0.6 : 1,
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.08em]"
                        style={{ backgroundColor: cfg.badge, color: cfg.badgeText }}
                      >
                        {alert.severity}
                      </span>
                      <span
                        className="text-xs font-bold"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        Rule: {alert.rule_id}
                      </span>
                      <span
                        className="text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Session #{alert.session_id}
                      </span>
                    </div>

                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {alert.description}
                    </p>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Triggered at: {new Date(alert.triggered_at).toLocaleString()}
                    </span>
                  </div>

                  <BigButton
                    label={alert.reviewed ? '✓ Reviewed' : 'Mark Reviewed'}
                    onClick={() => handleReview(alert.id, alert.reviewed)}
                    variant={alert.reviewed ? 'secondary' : 'primary'}
                    className="text-xs min-h-[40px] py-2 px-4 whitespace-nowrap shrink-0"
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </KioskWrapper>
  );
}
