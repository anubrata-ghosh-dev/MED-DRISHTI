'use client';

import React from 'react';

interface ClinicalSummaryViewProps {
  summary: any;
}

export const ClinicalSummaryView: React.FC<ClinicalSummaryViewProps> = ({ summary }) => {
  if (!summary) {
    return (
      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-slate-500">No summary available</p>
      </div>
    );
  }

  const { patient, subjective, objective, assessment_triage } = summary;

  return (
    <div className="space-y-6">
      {/* Patient Information Header */}
      <div className="bg-gradient-to-r from-[var(--pulse-teal)] to-emerald-600 text-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{patient?.name}</h2>
            <div className="mt-2 space-y-1 text-sm opacity-90">
              <p>ID: {patient?.id} | Gender: {patient?.gender}</p>
              <p>Preferred Language: {patient?.language}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75">Generated at</p>
            <p className="text-sm font-mono">
              {new Date(summary.generated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Subjective (Patient-Reported) Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[var(--chart-ink)] mb-4 flex items-center gap-2">
          📋 Subjective (Patient-Reported)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Chief Complaint
            </label>
            <p className="text-base text-slate-800 bg-slate-50 p-3 rounded-lg">
              {subjective?.chief_complaint || '(Not recorded)'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              History of Present Illness (HPI)
            </label>
            <p className="text-base text-slate-800 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">
              {subjective?.hpi || '(Not recorded)'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Current Medications
              </label>
              <p className="text-base text-slate-800 bg-slate-50 p-3 rounded-lg">
                {subjective?.patient_reported_medications || '(None reported)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Allergies
              </label>
              <p className="text-base text-slate-800 bg-slate-50 p-3 rounded-lg">
                {subjective?.patient_reported_allergies || '(None reported)'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Objective (Clinically-Extracted) Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[var(--chart-ink)] mb-4 flex items-center gap-2">
          🔬 Objective (Extracted from Documents)
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Vitals & Labs ({objective?.vitals_and_labs?.length || 0} items)
            </label>
            {objective?.vitals_and_labs && objective.vitals_and_labs.length > 0 ? (
              <ul className="space-y-2">
                {objective.vitals_and_labs.map((item: any, idx: number) => (
                  <li key={idx} className="bg-slate-50 p-3 rounded-lg text-sm">
                    <span className="font-semibold">{item.name}:</span> {item.value} {item.unit || ''}
                    {item.confidence && (
                      <span className="text-xs text-slate-500 ml-2">
                        (confidence: {(item.confidence * 100).toFixed(0)}%)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">No vitals/labs extracted</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              OCR-Extracted Medications ({objective?.ocr_extracted_medications?.length || 0} items)
            </label>
            {objective?.ocr_extracted_medications && objective.ocr_extracted_medications.length > 0 ? (
              <ul className="space-y-2">
                {objective.ocr_extracted_medications.map((item: any, idx: number) => (
                  <li key={idx} className="bg-slate-50 p-3 rounded-lg text-sm">
                    {item.text}
                    {item.confidence && (
                      <span className="text-xs text-slate-500 ml-2">
                        (confidence: {(item.confidence * 100).toFixed(0)}%)
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">No medications extracted from documents</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Total Documents Analyzed
            </label>
            <p className="text-base font-bold text-[var(--pulse-teal)]">
              {objective?.total_documents_analyzed || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Assessment & Triage Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[var(--chart-ink)] mb-4 flex items-center gap-2">
          🚨 Assessment & Triage
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Triage Status
            </label>
            <div
              className={`inline-block px-4 py-2 rounded-full font-bold text-white ${
                assessment_triage?.triage_status === 'CRITICAL'
                  ? 'bg-red-600'
                  : assessment_triage?.triage_status === 'HIGH'
                  ? 'bg-orange-500'
                  : assessment_triage?.triage_status === 'MEDIUM'
                  ? 'bg-yellow-500'
                  : 'bg-green-600'
              }`}
            >
              {assessment_triage?.triage_status || 'UNKNOWN'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Red Flags ({assessment_triage?.red_flags_count || 0})
            </label>
            {assessment_triage?.red_flags && assessment_triage.red_flags.length > 0 ? (
              <ul className="space-y-2">
                {assessment_triage.red_flags.map((flag: any, idx: number) => (
                  <li
                    key={idx}
                    className={`p-3 rounded-lg border-l-4 ${
                      flag.severity === 'CRITICAL'
                        ? 'bg-red-50 border-red-500'
                        : flag.severity === 'HIGH'
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <div className="font-semibold text-sm">{flag.description}</div>
                    <div className="text-xs text-slate-600 mt-1">
                      Rule: {flag.rule_id} | Severity: {flag.severity}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 text-sm">No red flags detected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
