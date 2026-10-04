'use client';

import React, { useState } from 'react';

interface ClinicalSummaryCardProps {
  summaryData: any;
}

export const ClinicalSummaryCard: React.FC<ClinicalSummaryCardProps> = ({
  summaryData,
}) => {
  const [selectedEntityTrace, setSelectedEntityTrace] = useState<any | null>(null);

  if (!summaryData) return null;

  const { patient, subjective, objective, assessment_triage } = summaryData;

  return (
    <div className="w-full bg-[var(--glass-bg)] rounded-3xl border border-[var(--line)] shadow-xl p-8 flex flex-col gap-8">
      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[var(--glass-border)]">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Synthesized Clinical Intake Summary
          </span>
          <h2 className="text-2xl font-black text-[var(--text-primary)]">
            {patient?.name || 'Patient'} ({patient?.gender}, {patient?.dob || 'N/A'})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-4 py-2 rounded-full text-xs font-extrabold tracking-wider ${
              assessment_triage?.triage_status === 'CRITICAL'
                ? 'bg-red-100 text-red-700 animate-pulse ring-2 ring-red-300'
                : assessment_triage?.triage_status === 'HIGH'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            TRIAGE STATUS: {assessment_triage?.triage_status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--glass-bg-strong)] p-4">
          <h3 className="font-bold text-[var(--text-primary)]">Known medical history</h3>
          {subjective?.past_medical_history?.length ? subjective.past_medical_history.map((item: any, index: number) => (
            <p key={index} className="mt-1 text-[var(--text-secondary)]">{item.condition}{item.status ? ` · ${item.status}` : ''}{item.diagnosed ? ` · since ${item.diagnosed}` : ''}</p>
          )) : <p className="mt-1 text-[var(--text-muted)]">No prior conditions recorded.</p>}
          {subjective?.past_surgical_history?.map((item: any, index: number) => (
            <p key={`surgery-${index}`} className="mt-1 text-[var(--text-secondary)]">Surgery: {item.procedure}{item.date ? ` · ${item.date}` : ''}</p>
          ))}
          {subjective?.previous_visit_complaints?.map((complaint: string, index: number) => (
            <p key={`visit-${index}`} className="mt-1 text-[var(--text-secondary)]">Previous visit: {complaint}</p>
          ))}
        </div>
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--glass-bg-strong)] p-4">
          <h3 className="font-bold text-[var(--text-primary)]">Medicines and allergies</h3>
          <p className="mt-1 text-[var(--text-secondary)]">Reported medicines: {subjective?.patient_reported_medications || 'Not recorded'}</p>
          <p className="mt-1 text-[var(--text-secondary)]">Reported allergies: {subjective?.patient_reported_allergies || 'Not recorded'}</p>
        </div>
        {(subjective?.family_history?.length > 0 || subjective?.personal_history?.length > 0 || subjective?.review_of_systems?.length > 0 || subjective?.ayush_history?.length > 0) && (
          <div className="sm:col-span-2 rounded-2xl border border-[var(--line)] bg-[var(--glass-bg-strong)] p-4">
            <h3 className="font-bold text-[var(--text-primary)]">Family and personal history</h3>
            {subjective.family_history?.map((item: any, index: number) => <p key={`family-${index}`} className="mt-1 text-[var(--text-secondary)]">Family: {item.condition} ({item.relationship}){item.relevance ? ` · ${item.relevance}` : ''}</p>)}
            {subjective.personal_history?.map((item: any, index: number) => <p key={`personal-${index}`} className="mt-1 text-[var(--text-secondary)]">{item.category}: {item.value || item.detail || 'Recorded'}</p>)}
            {subjective.review_of_systems?.map((item: any, index: number) => <p key={`ros-${index}`} className="mt-1 text-[var(--text-secondary)]">{item.system}: {item.finding || item.detail || 'Recorded'}</p>)}
            {subjective.ayush_history?.map((item: any, index: number) => <p key={`ayush-${index}`} className="mt-1 text-[var(--text-secondary)]">{item.parameter}: {item.value || item.detail || 'Recorded'}</p>)}
          </div>
        )}
      </div>

      {/* Subjective History */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
          🗣️ Subjective Findings (Patient Intake)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[var(--glass-bg-strong)] rounded-2xl border border-[var(--line)]">
            <span className="text-xs font-bold text-slate-400 uppercase">Chief Complaint</span>
            <p className="text-base font-semibold text-[var(--text-primary)] mt-1">
              {subjective?.chief_complaint}
            </p>
          </div>
          <div className="p-4 bg-[var(--glass-bg-strong)] rounded-2xl border border-[var(--line)]">
            <span className="text-xs font-bold text-slate-400 uppercase">History of Present Illness</span>
            <p className="text-base font-medium text-[var(--text-secondary)] mt-1">
              {subjective?.hpi}
            </p>
          </div>
        </div>
      </div>

      {objective?.connections_for_review?.length > 0 && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <h3 className="text-base font-extrabold text-blue-950">Related information to review</h3>
          <p className="mt-1 text-xs text-blue-800">These links connect recorded history to uploaded results; they are prompts for clinical review, not diagnoses.</p>
          {objective.connections_for_review.map((connection: any, index: number) => (
            <div key={index} className="mt-3 rounded-xl bg-[var(--glass-bg)] p-3 text-sm text-[var(--text-secondary)]">
              <p className="font-bold text-[var(--text-primary)]">{connection.title}</p>
              <p className="mt-1">{connection.detail}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Sources: {connection.sources?.join(', ')}</p>
            </div>
          ))}
        </section>
      )}

      {objective?.document_diagnoses?.length > 0 && (
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--glass-bg-strong)] p-5">
          <h3 className="text-base font-extrabold text-[var(--text-primary)]">Diagnoses written in uploaded records</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">OCR text from source documents; verify against the original record.</p>
          {objective.document_diagnoses.map((item: any, index: number) => (
            <p key={index} className="mt-2 text-sm text-[var(--text-secondary)]"><strong>{item.value}</strong> · {item.document_name} · {Math.round((item.confidence || 0) * 100)}% extraction confidence</p>
          ))}
        </section>
      )}

      {/* Objective & Extracted Entities (with Confidence & Traceability) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            🔬 Objective Extracted Data (OCR & Documents)
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            Click entity pill to view document source traceability
          </span>
        </div>

        {/* Vitals */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Extracted Vitals & Lab Values</span>
          <div className="flex flex-wrap gap-2">
            {objective?.vitals_and_labs?.length === 0 ? (
              <span className="text-sm text-slate-400 italic">No OCR vitals extracted</span>
            ) : (
              objective?.vitals_and_labs?.map((item: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedEntityTrace(item)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 ${
                    item.low_confidence
                      ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-200'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <span>📊 {item.type}: {item.value}</span>
                  {item.low_confidence && (
                    <span className="bg-amber-200 text-amber-900 text-[10px] font-black px-1.5 py-0.5 rounded">
                      ⚠️ Low Conf
                    </span>
                  )}
                  <span className="text-[10px] opacity-60">🔍 Trace</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Extracted Medications */}
        <div className="space-y-2 mt-2">
          <span className="text-xs font-bold text-[var(--text-muted)] uppercase">Extracted OCR Medications</span>
          <div className="flex flex-wrap gap-2">
            {objective?.ocr_extracted_medications?.length === 0 ? (
              <span className="text-sm text-slate-400 italic">No OCR medications extracted</span>
            ) : (
              objective?.ocr_extracted_medications?.map((item: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedEntityTrace(item)}
                  className="px-3 py-2 bg-purple-50 border border-purple-200 text-purple-900 rounded-xl text-xs font-bold flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <span>💊 {item.value}</span>
                  <span className="text-[10px] opacity-60">🔍 Trace</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Red Flags Alert Box */}
      {assessment_triage?.red_flags?.length > 0 && (
        <div className="p-5 bg-red-50 border border-red-200 rounded-2xl flex flex-col gap-3">
          <h4 className="text-sm font-black text-red-900 uppercase tracking-wider flex items-center gap-2">
            🚨 Triggered Clinical Red Flags ({assessment_triage.red_flags.length})
          </h4>
          <div className="space-y-2">
            {assessment_triage.red_flags.map((rf: any) => (
              <div
                key={rf.id}
                className="p-3 bg-[var(--glass-bg)] border border-red-200 rounded-xl flex items-center justify-between text-xs font-bold text-red-800"
              >
                <span>• {rf.description}</span>
                <span className="uppercase text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-black">
                  {rf.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Medical Records */}
      {summaryData?.medical_records?.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            📋 Past Medical Records ({summaryData.medical_records.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summaryData.medical_records.map((rec: any) => {
              const typeLabels: Record<string, string> = {
                lab_report: '🧪 Lab Report',
                prescription: '💊 Prescription',
                discharge_summary: '🏥 Discharge',
                imaging: '📷 Imaging',
                other: '📋 Other',
              };

              return (
                <div
                  key={rec.id}
                  className="p-4 bg-[var(--glass-bg-strong)] rounded-2xl border border-[var(--line)] flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase bg-[var(--glass-bg-strong)] px-2 py-0.5 rounded">
                      {typeLabels[rec.record_type] || '📋 Other'}
                    </span>
                    <span className="text-sm font-bold text-[var(--text-primary)]">
                      {rec.title || rec.file_name}
                    </span>
                  </div>
                  {rec.description && (
                    <p className="text-xs text-[var(--text-secondary)]">{rec.description}</p>
                  )}
                  {rec.ocr_text && (
                    <p className="text-xs font-mono text-[var(--text-muted)] italic line-clamp-2">
                      &quot;{rec.ocr_text.substring(0, 150)}{rec.ocr_text.length > 150 ? '...' : ''}&quot;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Traceability Modal */}
      {selectedEntityTrace && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--glass-bg)] max-w-md w-full rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-extrabold text-[var(--text-primary)]">
                🔍 Entity Document Traceability
              </h4>
              <button
                onClick={() => setSelectedEntityTrace(null)}
                className="text-slate-400 hover:text-[var(--text-secondary)] text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Document Source</span>
                <p className="font-bold text-[var(--text-primary)]">{selectedEntityTrace.document_name}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Extracted Value</span>
                <p className="font-semibold text-[var(--pulse-teal)]">{selectedEntityTrace.value}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Original OCR Snippet</span>
                <p className="p-3 bg-[var(--glass-bg-strong)] border border-[var(--line)] rounded-xl font-mono text-xs text-[var(--text-secondary)] italic">
                  &quot;{selectedEntityTrace.source_text}&quot;
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Confidence Score</span>
                <p className="font-bold text-[var(--text-primary)]">
                  {Math.round(selectedEntityTrace.confidence * 100)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
