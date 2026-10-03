'use client';

import React, { useEffect, useState } from 'react';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { ClinicalSummaryCard } from '@/components/summary/ClinicalSummaryCard';
import { DocumentUploader } from '@/components/documents/DocumentUploader';
import { BigButton } from '@/components/ui/BigButton';
import {
  getDoctorQueue,
  getSessionSummary,
  verifySession,
  getSessionAuditLogs,
  getPatientMedicalRecords,
  getMedicalRecordFileUrl,
  MedicalRecordResponse,
} from '@/lib/api';

const TRIAGE_COLORS: Record<string, { bg: string; text: string }> = {
  CRITICAL: { bg: 'rgba(196,67,46,0.12)', text: 'var(--alert-coral)' },
  HIGH:     { bg: 'rgba(216,154,61,0.12)', text: 'var(--vitals-amber)' },
  MEDIUM:   { bg: 'rgba(31,111,99,0.10)',  text: 'var(--pulse-teal)' },
  LOW:      { bg: 'var(--glass-bg)',       text: 'var(--text-muted)' },
};

const RECORD_TYPES: Record<string, { emoji: string; label: string; bg: string; border: string; color: string }> = {
  lab_report:       { emoji: '🧪', label: 'Lab Report',  bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.20)', color: '#3b82f6' },
  prescription:     { emoji: '💊', label: 'Prescription', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.20)', color: '#8b5cf6' },
  discharge_summary:{ emoji: '🏥', label: 'Discharge',   bg: 'rgba(216,154,61,0.08)', border: 'rgba(216,154,61,0.20)', color: 'var(--vitals-amber)' },
  imaging:          { emoji: '📷', label: 'Imaging',     bg: 'rgba(31,111,99,0.08)', border: 'rgba(31,111,99,0.20)', color: 'var(--pulse-teal)' },
  other:            { emoji: '📋', label: 'Other',       bg: 'var(--glass-bg)', border: 'var(--glass-border)', color: 'var(--text-secondary)' },
};

export default function DoctorDashboardPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordResponse[]>([]);
  const [showMedicalRecords, setShowMedicalRecords] = useState(true);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [hpi, setHpi] = useState('');
  const [medications, setMedications] = useState('');
  const [allergies, setAllergies] = useState('');
  const [physicianNotes, setPhysicianNotes] = useState('');
  const [verifySuccess, setVerifySuccess] = useState(false);

  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const data = await getDoctorQueue();
      setQueue(data);
      if (data.length > 0 && !selectedSessionId) {
        loadSessionDetails(data[0].session_id);
      }
    } catch (err) {
      console.error('Error fetching doctor queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const loadSessionDetails = async (sessionId: number) => {
    setSelectedSessionId(sessionId);
    setLoadingSession(true);
    setVerifySuccess(false);
    try {
      const summary = await getSessionSummary(sessionId);
      setSummaryData(summary);
      setChiefComplaint(summary.subjective?.chief_complaint || '');
      setHpi(summary.subjective?.hpi || '');
      setMedications(summary.subjective?.patient_reported_medications || '');
      setAllergies(summary.subjective?.patient_reported_allergies || '');
      const logs = await getSessionAuditLogs(sessionId);
      setAuditLogs(logs);
      if (summary?.patient?.id) {
        try {
          const records = await getPatientMedicalRecords(summary.patient.id);
          setMedicalRecords(records);
        } catch {
          setMedicalRecords([]);
        }
      }
    } catch (err) {
      console.error('Error loading session details:', err);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleVerify = async () => {
    if (!selectedSessionId) return;
    setVerifying(true);
    try {
      await verifySession(selectedSessionId, {
        chief_complaint: chiefComplaint,
        history_of_present_illness: hpi,
        medications,
        allergies,
        physician_notes: physicianNotes,
      });
      setVerifySuccess(true);
      fetchQueue();
    } catch (err) {
      console.error('Error verifying session:', err);
    } finally {
      setVerifying(false);
    }
  };

  const filteredQueue = queue.filter((item) => {
    const matchesStatus =
      statusFilter === 'all' || item.status.toLowerCase() === statusFilter;
    const matchesSearch =
      item.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.session_id).includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  /* ── Shared input style ── */
  const inputStyle: React.CSSProperties = {
    width: '100%',
    borderRadius: '0.875rem',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--glass-bg)',
    backdropFilter: 'blur(8px)',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    outline: 'none',
    resize: 'vertical' as const,
    transition: 'border-color 150ms, box-shadow 150ms',
  };

  return (
    <KioskWrapper showLanguageTag={false}>
      <div className="w-full max-w-7xl flex flex-col gap-5 animate-fade-slide-up">

        {/* ── Dashboard Header ── */}
        <div
          className="glass-card rounded-[1.75rem] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em]"
                style={{ backgroundColor: 'rgba(31,111,99,0.12)', color: 'var(--pulse-teal)' }}
              >
                Physician Dashboard
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Dr. Review &amp; Sign-off Workspace
              </span>
            </div>
            <h2 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              Patient Clinical Queue
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search patient or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 rounded-2xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pulse-teal)]"
              style={{
                backgroundColor: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-primary)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <button
              onClick={fetchQueue}
              className="p-2.5 rounded-xl transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md focus:outline-none"
              style={{
                backgroundColor: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
              }}
              title="Refresh queue"
            >
              🔄
            </button>
          </div>
        </div>

        {/* ── Two-panel layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* ── Left: Queue ── */}
          <div
            className="lg:col-span-4 glass-card rounded-[1.75rem] p-4 flex flex-col gap-3 max-h-[820px] overflow-y-auto"
          >
            {/* Filter tabs */}
            <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--line)' }}>
              <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Queue ({filteredQueue.length})
              </span>
              <div
                className="flex gap-0.5 rounded-xl p-1"
                style={{ backgroundColor: 'var(--glass-bg)' }}
              >
                {(['active', 'completed', 'all'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all duration-150 focus:outline-none"
                    style={{
                      backgroundColor: statusFilter === st ? 'var(--glass-bg-strong)' : 'transparent',
                      color: statusFilter === st ? 'var(--text-primary)' : 'var(--text-muted)',
                      boxShadow: statusFilter === st ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loadingQueue ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading queue...</p>
            ) : filteredQueue.length === 0 ? (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No matching patients found.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredQueue.map((item, i) => {
                  const triage = (item.triage_status || 'LOW').toUpperCase() as keyof typeof TRIAGE_COLORS;
                  const tc = TRIAGE_COLORS[triage] ?? TRIAGE_COLORS.LOW;
                  const isSelected = selectedSessionId === item.session_id;

                  return (
                    <div
                      key={item.session_id}
                      onClick={() => loadSessionDetails(item.session_id)}
                      className="cursor-pointer rounded-2xl p-4 transition-all duration-150 animate-fade-slide-up hover:-translate-y-0.5"
                      style={{
                        backgroundColor: isSelected ? 'rgba(31,111,99,0.07)' : 'var(--glass-bg)',
                        border: isSelected
                          ? '1px solid rgba(31,111,99,0.30)'
                          : '1px solid var(--glass-border)',
                        boxShadow: isSelected ? '0 0 0 2px rgba(31,111,99,0.15)' : 'none',
                        animationDelay: `${i * 40}ms`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                          {item.patient_name}
                        </span>
                        <span
                          className="text-[10px] font-black px-2 py-0.5 rounded-full uppercase"
                          style={{ backgroundColor: tc.bg, color: tc.text }}
                        >
                          {item.triage_status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          #{item.session_id} · {item.patient_gender || 'N/A'}
                          {item.medical_records_count > 0 && (
                            <span
                              className="ml-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold"
                              style={{ backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}
                            >
                              📋 {item.medical_records_count}
                            </span>
                          )}
                        </span>
                        <span
                          className="text-xs font-bold capitalize"
                          style={{ color: item.status === 'completed' ? '#22c55e' : 'var(--pulse-teal)' }}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Right: Session detail ── */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {!selectedSessionId ? (
              <div
                className="glass-card rounded-[1.75rem] p-16 text-center"
                style={{ color: 'var(--text-muted)' }}
              >
                <p className="text-4xl mb-3">🩺</p>
                <p className="font-medium">Select a patient from the queue to view clinical details.</p>
              </div>
            ) : loadingSession ? (
              <div
                className="glass-card rounded-[1.75rem] p-16 text-center"
                style={{ color: 'var(--text-muted)' }}
              >
                <div className="animate-spin inline-block w-6 h-6 border-2 rounded-full mb-3"
                  style={{ borderColor: 'var(--pulse-teal) transparent transparent transparent' }} />
                <p className="font-medium">Loading session summary &amp; documents...</p>
              </div>
            ) : (
              <>
                {summaryData && <ClinicalSummaryCard summaryData={summaryData} />}

                <DocumentUploader
                  sessionId={selectedSessionId}
                  onUploadSuccess={() => loadSessionDetails(selectedSessionId)}
                />

                {/* Medical records */}
                {medicalRecords.length > 0 && (
                  <div className="glass-card rounded-[1.75rem] p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-extrabold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                        📋 Patient Medical History ({medicalRecords.length})
                      </h3>
                      <button
                        onClick={() => setShowMedicalRecords(!showMedicalRecords)}
                        className="text-xs font-bold transition-colors hover:underline"
                        style={{ color: 'var(--pulse-teal)' }}
                      >
                        {showMedicalRecords ? 'Collapse ▲' : 'Expand ▼'}
                      </button>
                    </div>

                    {showMedicalRecords && (
                      <div className="flex flex-col gap-3">
                        {medicalRecords.map((rec) => {
                          const typeInfo = RECORD_TYPES[rec.record_type] ?? RECORD_TYPES.other;
                          return (
                            <div
                              key={rec.id}
                              className="rounded-xl p-4 flex flex-col gap-2"
                              style={{
                                backgroundColor: typeInfo.bg,
                                border: `1px solid ${typeInfo.border}`,
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="rounded-lg px-2.5 py-1 text-[10px] font-bold"
                                    style={{ backgroundColor: typeInfo.bg, border: `1px solid ${typeInfo.border}`, color: typeInfo.color }}
                                  >
                                    {typeInfo.emoji} {typeInfo.label}
                                  </span>
                                  <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                                    {rec.title || rec.file_name}
                                  </span>
                                </div>
                                {rec.file_name && (
                                  <a
                                    href={getMedicalRecordFileUrl(rec.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-bold hover:underline flex items-center gap-1"
                                    style={{ color: 'var(--pulse-teal)' }}
                                  >
                                    📎 View File
                                  </a>
                                )}
                              </div>
                              {rec.description && (
                                <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                                  <span className="font-bold" style={{ color: 'var(--text-muted)' }}>Notes: </span>
                                  {rec.description}
                                </p>
                              )}
                              {rec.ocr_text && (
                                <div
                                  className="rounded-xl p-3"
                                  style={{ backgroundColor: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                                >
                                  <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                                    OCR Extracted Text
                                  </span>
                                  <p className="text-xs font-mono mt-1 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                                    {rec.ocr_text}
                                  </p>
                                </div>
                              )}
                              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                                Uploaded: {new Date(rec.uploaded_at).toLocaleString()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Physician Verification Form */}
                <div className="glass-card rounded-[1.75rem] p-7 flex flex-col gap-5">
                  <div
                    className="flex items-center justify-between pb-4"
                    style={{ borderBottom: '1px solid var(--line)' }}
                  >
                    <div>
                      <h3 className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
                        ✍️ Physician Verification &amp; Sign-off
                      </h3>
                      <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        Verify intake notes, edit values if needed, and append physician notes.
                      </p>
                    </div>
                    {verifySuccess && (
                      <span
                        className="text-xs font-black px-3 py-1 rounded-full animate-bounce"
                        style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e' }}
                      >
                        ✓ Verified &amp; Signed Off
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Chief Complaint', value: chiefComplaint, onChange: setChiefComplaint },
                      { label: 'HPI Notes', value: hpi, onChange: setHpi },
                    ].map(({ label, value, onChange }) => (
                      <div key={label} className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-secondary)' }}>
                          {label}
                        </label>
                        <textarea
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          className="clinical-input min-h-[80px]"
                          style={inputStyle}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'var(--pulse-teal)';
                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31,111,99,0.15)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--glass-border)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: 'var(--text-secondary)' }}>
                      Physician Notes &amp; Impression
                    </label>
                    <textarea
                      value={physicianNotes}
                      onChange={(e) => setPhysicianNotes(e.target.value)}
                      placeholder="Add physician notes or diagnosis summary here..."
                      className="clinical-input min-h-[100px]"
                      style={{ ...inputStyle, color: physicianNotes ? 'var(--text-primary)' : 'var(--text-muted)' }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'var(--pulse-teal)';
                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(31,111,99,0.15)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--glass-border)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  <BigButton
                    label="Verify & Complete Session"
                    onClick={handleVerify}
                    loading={verifying}
                    variant="primary"
                    className="w-full"
                  />

                  {/* Audit Trail */}
                  {auditLogs.length > 0 && (
                    <div
                      className="mt-2 pt-4 flex flex-col gap-2"
                      style={{ borderTop: '1px solid var(--line)' }}
                    >
                      <span className="text-xs font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                        📜 Compliance Audit Log ({auditLogs.length})
                      </span>
                      <div className="space-y-1.5">
                        {auditLogs.map((log) => (
                          <div
                            key={log.id}
                            className="rounded-xl px-3 py-2.5 text-xs flex items-center justify-between font-medium"
                            style={{
                              backgroundColor: 'var(--glass-bg)',
                              border: '1px solid var(--glass-border)',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <span>• {log.action}: {log.details}</span>
                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </KioskWrapper>
  );
}
