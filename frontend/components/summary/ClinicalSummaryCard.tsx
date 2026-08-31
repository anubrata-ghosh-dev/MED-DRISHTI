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
    <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 flex flex-col gap-8">
      {/* Summary Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Synthesized Clinical Intake Summary
          </span>
          <h2 className="text-2xl font-black text-slate-900">
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

      {/* Subjective History */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          🗣️ Subjective Findings (Patient Intake)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase">Chief Complaint</span>
            <p className="text-base font-semibold text-slate-800 mt-1">
              {subjective?.chief_complaint}
            </p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase">History of Present Illness</span>
            <p className="text-base font-medium text-slate-700 mt-1">
              {subjective?.hpi}
            </p>
          </div>
        </div>
      </div>

      {/* Objective & Extracted Entities (with Confidence & Traceability) */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            🔬 Objective Extracted Data (OCR & Documents)
          </h3>
          <span className="text-xs text-slate-400 font-semibold">
            Click entity pill to view document source traceability
          </span>
        </div>

        {/* Vitals */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase">Extracted Vitals & Lab Values</span>
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
          <span className="text-xs font-bold text-slate-500 uppercase">Extracted OCR Medications</span>
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
                className="p-3 bg-white border border-red-200 rounded-xl flex items-center justify-between text-xs font-bold text-red-800"
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

      {/* Traceability Modal */}
      {selectedEntityTrace && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl flex flex-col gap-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-extrabold text-slate-900">
                🔍 Entity Document Traceability
              </h4>
              <button
                onClick={() => setSelectedEntityTrace(null)}
                className="text-slate-400 hover:text-slate-700 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Document Source</span>
                <p className="font-bold text-slate-800">{selectedEntityTrace.document_name}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Extracted Value</span>
                <p className="font-semibold text-blue-700">{selectedEntityTrace.value}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Original OCR Snippet</span>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 italic">
                  "{selectedEntityTrace.source_text}"
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase">Confidence Score</span>
                <p className="font-bold text-slate-800">
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
