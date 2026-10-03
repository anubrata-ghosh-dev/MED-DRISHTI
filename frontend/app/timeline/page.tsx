'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { BigButton } from '@/components/ui/BigButton';
import { useAuth } from '@/lib/auth-context';
import {
  getPatientMedicalRecords,
  getMedicalRecordFileUrl,
  MedicalRecordResponse,
} from '@/lib/api';

const RECORD_TYPE_CONFIG: Record<
  string,
  { label: string; emoji: string; color: string; badgeColor: string }
> = {
  lab_report: {
    label: 'Lab Report',
    emoji: '🧪',
    color: 'border-blue-500 bg-blue-500/10 text-blue-800',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  prescription: {
    label: 'Prescription',
    emoji: '💊',
    color: 'border-purple-500 bg-purple-500/10 text-purple-800',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  discharge_summary: {
    label: 'Discharge Summary',
    emoji: '🏥',
    color: 'border-amber-500 bg-amber-500/10 text-amber-800',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  imaging: {
    label: 'X-Ray / Imaging',
    emoji: '📷',
    color: 'border-teal-500 bg-teal-500/10 text-teal-800',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  other: {
    label: 'Other Record',
    emoji: '📋',
    color: 'border-slate-500 bg-slate-500/10 text-slate-800',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
  },
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Records' },
  { value: 'lab_report', label: '🧪 Lab Reports' },
  { value: 'prescription', label: '💊 Prescriptions' },
  { value: 'imaging', label: '📷 Imaging' },
  { value: 'discharge_summary', label: '🏥 Discharge' },
  { value: 'other', label: '📋 Other' },
];

export default function TimelinePage() {
  const router = useRouter();
  const { patientId, sessionId, department } = useAuth();

  const [records, setRecords] = useState<MedicalRecordResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  useEffect(() => {
    const fetchRecords = async () => {
      if (!patientId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await getPatientMedicalRecords(patientId);
        // Sort by uploaded_at desc
        const sorted = (data || []).sort(
          (a, b) =>
            new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
        );
        setRecords(sorted);
      } catch (err: any) {
        console.error('Failed to fetch patient timeline records:', err);
        setError('Could not load historical records. You can still continue your check-in.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [patientId]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    if (selectedFilter === 'all') return records;
    return records.filter((r) => r.record_type === selectedFilter);
  }, [records, selectedFilter]);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getRecordMeta = (type: string) => {
    return RECORD_TYPE_CONFIG[type] || RECORD_TYPE_CONFIG.other;
  };

  return (
    <KioskWrapper>
      <div className="w-full flex flex-col items-center gap-6 animate-fadeIn">
        <ProgressStepper
          steps={['Language', 'Register', 'Consent', 'Intake', 'Records', 'Review']}
          currentStep={5}
        />

        {/* Title Header */}
        <div className="text-center space-y-2 mb-2 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--pulse-teal)]">
            Step 6 • Summary & Timeline / चरण 6
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--chart-ink)]">
            Your Medical Timeline
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">
            Review your historical records and active clinical session before completing check-in.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="w-full max-w-2xl flex items-center justify-center flex-wrap gap-2">
          {FILTER_OPTIONS.map((filter) => {
            const isSelected = selectedFilter === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setSelectedFilter(filter.value)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-[var(--pulse-teal)] text-white shadow-md shadow-[rgba(31,111,99,0.2)] scale-105'
                    : 'bg-white/80 border border-[var(--line)] text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Timeline Container */}
        <div className="w-full max-w-2xl bg-white/90 p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-6">
          {error && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
              <div className="animate-spin text-4xl">⏳</div>
              <p className="font-semibold text-sm">Loading your timeline...</p>
            </div>
          ) : (
            <div className="relative pl-6 md:pl-8 border-l-2 border-slate-200 flex flex-col gap-8 my-2">
              {/* Active Clinical Session Event Node */}
              <div className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[31px] md:-left-[39px] top-1.5 flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-[var(--pulse-teal)] text-white text-xs md:text-sm font-bold shadow-md shadow-[rgba(31,111,99,0.3)] ring-4 ring-white">
                  🩺
                </div>

                <div className="rounded-2xl border border-[rgba(31,111,99,0.2)] bg-[rgba(31,111,99,0.04)] p-4 shadow-sm transition-all hover:border-[var(--pulse-teal)]">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                    <span className="rounded-full bg-[rgba(31,111,99,0.14)] px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-[var(--pulse-teal)]">
                      Current Intake Session
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Today • In Progress
                    </span>
                  </div>

                  <h3 className="text-base md:text-lg font-bold text-slate-900 mt-1">
                    Kiosk Check-in & Preliminary Triage
                  </h3>

                  <p className="text-xs md:text-sm text-slate-600 mt-1">
                    {department ? `Department: ${department}` : 'General Consultation'}
                    {sessionId ? ` • Session ID #${sessionId}` : ''}
                  </p>
                </div>
              </div>

              {/* Uploaded Records Nodes */}
              {filteredRecords.map((rec) => {
                const meta = getRecordMeta(rec.record_type);
                return (
                  <div key={rec.id} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute -left-[31px] md:-left-[39px] top-1.5 flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-white border-2 border-slate-300 text-sm shadow-sm ring-4 ring-white group-hover:border-[var(--pulse-teal)] transition-colors">
                      {meta.emoji}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:bg-white hover:border-slate-300 hover:shadow-md">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                        <span
                          className={`rounded-lg border px-2 py-0.5 text-[10px] font-extrabold tracking-wide ${meta.badgeColor}`}
                        >
                          {meta.emoji} {meta.label}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          {formatDate(rec.uploaded_at)}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-800">
                        {rec.title || rec.file_name || 'Medical Document'}
                      </h4>

                      {rec.description && (
                        <p className="text-xs md:text-sm text-slate-600 mt-1 leading-relaxed">
                          {rec.description}
                        </p>
                      )}

                      {rec.file_name && (
                        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                          <span className="truncate max-w-[200px]">
                            📎 {rec.file_name}
                          </span>
                          <a
                            href={getMedicalRecordFileUrl(rec.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--pulse-teal)] font-bold hover:underline"
                          >
                            View File ↗
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Empty State when no records uploaded or no filtered matches */}
              {filteredRecords.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                  <span className="text-3xl mb-2 block">📄</span>
                  <p className="text-sm font-semibold text-slate-600">
                    {records.length === 0
                      ? 'No previous records uploaded. Continue to complete your check-in.'
                      : 'No records matching this category.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Button */}
          <div className="pt-2">
            <BigButton
              label="Continue to check-in complete →"
              onClick={() => router.push('/done')}
              variant="primary"
              className="w-full font-bold text-lg md:text-xl py-4"
            />
          </div>
        </div>
      </div>
    </KioskWrapper>
  );
}
