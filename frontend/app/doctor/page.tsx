'use client';

import React, { useEffect, useState } from 'react';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { ClinicalSummaryCard } from '@/components/summary/ClinicalSummaryCard';
import { DocumentUploader } from '@/components/documents/DocumentUploader';
import { BigButton } from '@/components/ui/BigButton';
import { getDoctorQueue, getSessionSummary, verifySession, getSessionAuditLogs } from '@/lib/api';

export default function DoctorDashboardPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [loadingSession, setLoadingSession] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable fields for physician review
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

      // Pre-fill editable verification fields
      setChiefComplaint(summary.subjective?.chief_complaint || '');
      setHpi(summary.subjective?.hpi || '');
      setMedications(summary.subjective?.patient_reported_medications || '');
      setAllergies(summary.subjective?.patient_reported_allergies || '');

      const logs = await getSessionAuditLogs(sessionId);
      setAuditLogs(logs);
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
      fetchQueue(); // Refresh queue status
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

  return (
    <KioskWrapper showLanguageTag={false}>
      <div className="w-full max-w-7xl flex flex-col gap-6 animate-fadeIn">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-lg">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[rgba(31,111,99,0.12)] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--pulse-teal)]">
                Physician Dashboard
              </span>
              <span className="text-xs text-slate-400 font-medium">Dr. Review & Sign-off Workspace</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Patient Clinical Queue
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search patient name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 rounded-2xl border border-[var(--line)] bg-slate-50 px-4 py-2 text-sm text-[var(--chart-ink)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,111,99,0.18)]"
            />
            <button
              onClick={fetchQueue}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 font-bold text-sm"
              title="Refresh queue"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Workspace Layout: Left Queue + Right Session Detail */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Patient Queue List (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-lg p-5 flex flex-col gap-4 max-h-[800px] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Patient Queue ({filteredQueue.length})
              </span>
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                {(['active', 'completed', 'all'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                      statusFilter === st
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {loadingQueue ? (
              <p className="text-sm text-slate-400 text-center py-8">Loading queue...</p>
            ) : filteredQueue.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No matching patients found.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredQueue.map((item) => (
                  <div
                    key={item.session_id}
                    onClick={() => loadSessionDetails(item.session_id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                      selectedSessionId === item.session_id
                        ? 'border-[rgba(31,111,99,0.25)] bg-[rgba(31,111,99,0.06)] ring-2 ring-[rgba(31,111,99,0.12)]'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-extrabold text-slate-900 text-base">
                        {item.patient_name}
                      </span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                          item.triage_status === 'CRITICAL'
                            ? 'bg-red-100 text-red-700'
                            : item.triage_status === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.triage_status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        Session #{item.session_id} • {item.patient_gender || 'N/A'}
                      </span>
                      <span
                        className={`font-bold capitalize ${
                          item.status === 'completed'
                            ? 'text-emerald-600'
                            : 'text-[var(--pulse-teal)]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Selected Patient Session Detail (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {!selectedSessionId ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-400 font-medium">
                Select a patient from the queue to view clinical details and sign off.
              </div>
            ) : loadingSession ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center text-slate-500 font-medium">
                Loading session summary & documents...
              </div>
            ) : (
              <>
                {/* Unified Clinical Summary Card with Traceability */}
                {summaryData && <ClinicalSummaryCard summaryData={summaryData} />}

                {/* Document Upload & OCR Section */}
                <DocumentUploader
                  sessionId={selectedSessionId}
                  onUploadSuccess={() => loadSessionDetails(selectedSessionId)}
                />

                {/* Physician Verification & Review Form */}
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl flex flex-col gap-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">
                        ✍️ Physician Verification & Sign-off
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Verify intake notes, edit values if needed, and append physician notes.
                      </p>
                    </div>
                    {verifySuccess && (
                      <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full animate-bounce">
                        ✓ Verified & Signed Off
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        Chief Complaint
                      </label>
                      <textarea
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        className="min-h-[80px] rounded-xl border border-[var(--line)] bg-slate-50 p-3 text-sm text-[var(--chart-ink)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,111,99,0.18)]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase">
                        HPI Notes
                      </label>
                      <textarea
                        value={hpi}
                        onChange={(e) => setHpi(e.target.value)}
                        className="min-h-[80px] rounded-xl border border-[var(--line)] bg-slate-50 p-3 text-sm text-[var(--chart-ink)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,111,99,0.18)]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      Physician Notes & Impression
                    </label>
                    <textarea
                      value={physicianNotes}
                      onChange={(e) => setPhysicianNotes(e.target.value)}
                      placeholder="Add physician notes or diagnosis summary here..."
                      className="min-h-[100px] rounded-xl border border-[var(--line)] bg-slate-50 p-4 text-sm text-[var(--chart-ink)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[rgba(31,111,99,0.18)]"
                    />
                  </div>

                  <BigButton
                    label="Verify & Complete Session"
                    onClick={handleVerify}
                    loading={verifying}
                    variant="primary"
                    className="w-full"
                  />

                  {/* Audit Trail Timeline */}
                  {auditLogs.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                        📜 Compliance Audit Log Trail ({auditLogs.length})
                      </span>
                      <div className="space-y-1.5">
                        {auditLogs.map((log) => (
                          <div
                            key={log.id}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between text-slate-600 font-medium"
                          >
                            <span>• {log.action}: {log.details}</span>
                            <span className="text-[10px] text-slate-400">
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
