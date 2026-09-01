'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { ClinicalSummaryView } from '@/components/summary/ClinicalSummaryView';
import { BigButton } from '@/components/ui/BigButton';
import { getDoctorQueue, getSessionSummary, verifySession, getSessionAuditLogs } from '@/lib/api';

interface DoctorQueueItem {
  session_id: number;
  patient_id: number;
  patient_name: string;
  patient_gender: string;
  patient_dob: string | null;
  session_type: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  triage_status: string;
  red_flags_count: number;
  documents_count: number;
}

export default function DoctorDashboardPage() {
  const [queue, setQueue] = useState<DoctorQueueItem[]>([]);
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
      setTimeout(() => {
        fetchQueue(); // Refresh queue status
      }, 1000);
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

  const selectedItem = queue.find((item) => item.session_id === selectedSessionId);
  const isSessionCompleted = selectedItem?.status === 'completed';

  const getTriageStatusColor = (status: string) => {
    switch (status) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <KioskWrapper>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-[var(--chart-ink)] mb-2">
              👨‍⚕️ Physician Dashboard
            </h1>
            <p className="text-slate-600">Patient queue and clinical intake review</p>
          </div>
          <Link href="/">
            <BigButton label="← Back to Home" variant="secondary" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Patient Queue */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col max-h-[70vh]">
            <div className="bg-gradient-to-r from-[var(--pulse-teal)] to-emerald-600 text-white p-4">
              <h2 className="text-xl font-bold">Patient Queue</h2>
              <p className="text-sm opacity-90 mt-1">
                {queue.length} total | {queue.filter((q) => q.status === 'active').length} active
              </p>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="flex gap-2">
                {(['all', 'active', 'completed'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                      statusFilter === filter
                        ? 'bg-[var(--pulse-teal)] text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search patient name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:border-[var(--pulse-teal)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,111,99,0.1)]"
              />
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto">
              {loadingQueue ? (
                <div className="p-4 text-center text-slate-500">Loading queue...</div>
              ) : filteredQueue.length === 0 ? (
                <div className="p-4 text-center text-slate-500">No patients matching filters</div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredQueue.map((item) => (
                    <button
                      key={item.session_id}
                      onClick={() => loadSessionDetails(item.session_id)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors border-l-4 ${
                        selectedSessionId === item.session_id
                          ? 'bg-[var(--pulse-teal)]/10 border-[var(--pulse-teal)]'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="font-semibold text-slate-800">{item.patient_name}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        Session #{item.session_id} • {item.patient_gender}
                      </div>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            item.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.status.toUpperCase()}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${getTriageStatusColor(
                            item.triage_status
                          )}`}
                        >
                          {item.triage_status}
                        </span>
                        {item.red_flags_count > 0 && (
                          <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-800">
                            🚨 {item.red_flags_count} flags
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Session Details & Verification */}
          <div className="lg:col-span-2 flex flex-col gap-6 max-h-[70vh] overflow-y-auto pb-4">
            {loadingSession ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <div className="text-2xl mb-2">⏳</div>
                <p className="text-slate-600">Loading session details...</p>
              </div>
            ) : summaryData ? (
              <>
                {/* Clinical Summary View */}
                <ClinicalSummaryView summary={summaryData} />

                {/* Physician Verification Form */}
                {!isSessionCompleted && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg sticky bottom-0">
                    <h3 className="text-lg font-bold text-[var(--chart-ink)] mb-4">
                      ✅ Physician Verification & Sign-Off
                    </h3>

                    {verifySuccess && (
                      <div className="mb-4 p-4 bg-green-50 border border-green-300 rounded-lg text-green-800 font-medium text-center">
                        ✅ Session successfully verified and completed!
                      </div>
                    )}

                    <div className="space-y-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Chief Complaint (Verify)
                        </label>
                        <textarea
                          value={chiefComplaint}
                          onChange={(e) => setChiefComplaint(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[var(--pulse-teal)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,111,99,0.1)]"
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          History of Present Illness
                        </label>
                        <textarea
                          value={hpi}
                          onChange={(e) => setHpi(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[var(--pulse-teal)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,111,99,0.1)]"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Medications
                          </label>
                          <input
                            type="text"
                            value={medications}
                            onChange={(e) => setMedications(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[var(--pulse-teal)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,111,99,0.1)]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Allergies
                          </label>
                          <input
                            type="text"
                            value={allergies}
                            onChange={(e) => setAllergies(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[var(--pulse-teal)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,111,99,0.1)]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Physician Notes
                        </label>
                        <textarea
                          value={physicianNotes}
                          onChange={(e) => setPhysicianNotes(e.target.value)}
                          placeholder="Add assessment, plan, and follow-up instructions..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[var(--pulse-teal)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,111,99,0.1)]"
                          rows={3}
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleVerify}
                      disabled={verifying}
                      className="w-full py-3 px-4 bg-gradient-to-r from-[var(--pulse-teal)] to-emerald-600 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {verifying ? '⏳ Verifying...' : '✅ Verify & Complete Session'}
                    </button>
                  </div>
                )}

                {isSessionCompleted && (
                  <div className="bg-green-50 rounded-2xl border border-green-300 p-6 text-center">
                    <div className="text-4xl mb-2">✅</div>
                    <h3 className="text-xl font-bold text-green-800">Session Completed</h3>
                    <p className="text-green-700 text-sm mt-2">This session has been verified and signed off</p>
                  </div>
                )}

                {/* Audit Trail */}
                {auditLogs.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-[var(--chart-ink)] mb-4">
                      📋 Audit Trail ({auditLogs.length} entries)
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {auditLogs.map((log, idx) => (
                        <div key={idx} className="text-sm p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="font-semibold text-slate-800">{log.action}</div>
                          <div className="text-xs text-slate-600 mt-1">
                            {new Date(log.timestamp).toLocaleString()}
                          </div>
                          {log.details && (
                            <div className="text-xs text-slate-700 mt-1 italic">{log.details}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <p className="text-slate-600">Select a patient to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </KioskWrapper>
  );
}
