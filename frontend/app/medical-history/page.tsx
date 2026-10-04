'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { BigButton } from '@/components/ui/BigButton';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import {
  uploadMedicalRecord,
  getPatientMedicalRecords,
  deleteMedicalRecord,
  MedicalRecordResponse,
} from '@/lib/api';

const RECORD_TYPES = [
  { value: 'lab_report', label: '🧪 Lab Report', color: 'bg-blue-50 border-blue-200 text-blue-800' },
  { value: 'prescription', label: '💊 Prescription', color: 'bg-purple-50 border-purple-200 text-purple-800' },
  { value: 'discharge_summary', label: '🏥 Discharge Summary', color: 'bg-amber-50 border-amber-200 text-amber-800' },
  { value: 'imaging', label: '📷 X-Ray / Imaging', color: 'bg-teal-50 border-teal-200 text-teal-800' },
  { value: 'other', label: '📋 Other', color: 'bg-[var(--glass-bg-strong)] border-[var(--line)] text-[var(--text-primary)]' },
];

export default function MedicalHistoryPage() {
  const router = useRouter();
  const { patientId, sessionId } = useAuth();
  const { language } = useLanguage();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [recordType, setRecordType] = useState('other');
  const [uploading, setUploading] = useState(false);
  const [records, setRecords] = useState<MedicalRecordResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchRecords = async () => {
    if (!patientId) return;
    try {
      const data = await getPatientMedicalRecords(patientId);
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch medical records:', err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [patientId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setSuccessMsg(null);

      // Auto-fill title from filename
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }

      // Image preview
      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !patientId) return;

    setUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await uploadMedicalRecord(
        patientId,
        selectedFile,
        title || selectedFile.name,
        description,
        recordType,
        sessionId || undefined
      );
      setSuccessMsg('Record uploaded successfully!');
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setRecordType('other');
      setPreviewUrl(null);
      await fetchRecords();
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload medical record.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    try {
      await deleteMedicalRecord(recordId);
      await fetchRecords();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleContinue = () => {
    router.push('/timeline');
  };

  const handleSkip = () => {
    router.push('/timeline');
  };

  const getRecordTypeInfo = (type: string) => {
    return RECORD_TYPES.find((rt) => rt.value === type) || RECORD_TYPES[4];
  };

  return (
    <KioskWrapper>
      <div className="w-full flex flex-col items-center justify-center min-h-[75vh] gap-10 py-8">
        <ProgressStepper
          steps={['Language', 'Register', 'Consent', 'Department', 'Intake', 'Records']}
          currentStep={5}
        />

        {/* Header */}
        <div className="text-center space-y-1 mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--pulse-teal)]">
            Step 5 • Medical History
          </p>
          <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">
            Upload Previous Medical Records
          </h2>
          <p className="text-[var(--text-muted)] font-medium text-sm max-w-md mx-auto">
            Share your old prescriptions, lab reports, X-rays, or diagnostic reports.
            This helps the doctor review your complete medical history.
          </p>
        </div>

        {/* Main Upload Card */}
        <div className="w-full max-w-2xl bg-[var(--glass-bg)] p-8 rounded-3xl shadow-xl border border-[var(--glass-border)] flex flex-col gap-6 animate-fadeIn">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-sm font-bold flex items-center gap-2">
              <span className="text-lg">✓</span> {successMsg}
            </div>
          )}

          {/* Record Type Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Record Type
            </label>
            <div className="flex flex-wrap gap-2">
              {RECORD_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  onClick={() => setRecordType(rt.value)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                    recordType === rt.value
                      ? 'ring-2 ring-[var(--pulse-teal)] border-[var(--pulse-teal)] bg-[rgba(31,111,99,0.06)]'
                      : rt.color
                  }`}
                >
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          {/* File Drop Zone */}
          <div className="rounded-2xl border-2 border-dashed border-[var(--line)] bg-[var(--glass-bg-strong)] p-6 text-center transition-colors hover:border-[var(--pulse-teal)] hover:bg-[rgba(31,111,99,0.04)] flex flex-col items-center gap-3">
            <input
              type="file"
              id="medical-file-upload"
              accept=".pdf,.png,.jpg,.jpeg,.bmp,.tiff"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="medical-file-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <span className="text-5xl">📂</span>
              <span className="text-base font-bold text-[var(--text-secondary)]">
                {selectedFile ? selectedFile.name : 'Tap to select a file'}
              </span>
              <span className="text-xs text-slate-400">
                Supports PDF, PNG, JPG, BMP, TIFF (Max 10MB)
              </span>
            </label>
          </div>

          {/* Image preview */}
          {previewUrl && (
            <div className="rounded-2xl overflow-hidden border border-[var(--line)] max-h-48">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-contain bg-[var(--glass-bg-strong)]"
              />
            </div>
          )}

          {/* Title & Description */}
          {selectedFile && (
            <div className="flex flex-col gap-4 animate-fadeIn">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                  Title / Label
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Blood Test Report - June 2024"
                  className="rounded-xl border border-[var(--line)] bg-[var(--glass-bg-strong)] px-4 py-3 text-sm text-[var(--chart-ink)] focus:outline-none focus:ring-2 focus:ring-[rgba(31,111,99,0.18)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                  Notes (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any notes about this record, e.g. 'Diagnosed with diabetes in 2022', 'Post-surgery follow-up report'..."
                  className="min-h-[80px] rounded-xl border border-[var(--line)] bg-[var(--glass-bg-strong)] p-4 text-sm text-[var(--chart-ink)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[rgba(31,111,99,0.18)]"
                />
              </div>

              <BigButton
                label="📤 Upload Record"
                onClick={handleUpload}
                loading={uploading}
                variant="primary"
                className="w-full font-bold"
              />
            </div>
          )}

          {/* Uploaded Records List */}
          {records.length > 0 && (
            <div className="flex flex-col gap-3 pt-4 border-t border-[var(--glass-border)]">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                📋 Uploaded Records ({records.length})
              </span>

              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {records.map((rec) => {
                  const typeInfo = getRecordTypeInfo(rec.record_type);
                  return (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between p-3 bg-[var(--glass-bg-strong)] border border-[var(--line)] rounded-xl transition-all hover:border-[var(--line-strong)]"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`px-2 py-1 rounded-lg border text-[10px] font-bold whitespace-nowrap ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                            {rec.title || rec.file_name}
                          </span>
                          {rec.description && (
                            <span className="text-xs text-[var(--text-muted)] truncate">
                              {rec.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="ml-2 p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all text-sm"
                        title="Remove record"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <BigButton
              label="Skip →"
              onClick={handleSkip}
              variant="secondary"
              className="flex-1"
            />
            <BigButton
              label={records.length > 0 ? 'Continue →' : 'Upload & Continue'}
              onClick={handleContinue}
              variant="primary"
              className="flex-1 font-bold"
            />
          </div>
        </div>
      </div>
    </KioskWrapper>
  );
}
