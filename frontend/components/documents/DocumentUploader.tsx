'use client';

import React, { useState } from 'react';
import { uploadDocument } from '@/lib/api';
import { BigButton } from '../ui/BigButton';

interface DocumentUploaderProps {
  sessionId: number | string;
  onUploadSuccess?: (docResult: any) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  sessionId,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const data = await uploadDocument(sessionId, selectedFile);
      setResult(data);
      if (onUploadSuccess) onUploadSuccess(data);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload and process document.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-lg flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
          📄 Upload Clinical Documents & Prescriptions
        </h3>
        <p className="text-sm font-medium text-slate-500">
          Upload existing lab reports or prescriptions for automated OCR entity extraction.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* File Dropzone */}
      <div className="rounded-2xl border-2 border-dashed border-[var(--line)] bg-slate-50 p-6 text-center transition-colors hover:border-[var(--pulse-teal)] hover:bg-[rgba(31,111,99,0.04)] flex flex-col items-center gap-3">
        <input
          type="file"
          id="file-upload"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-2"
        >
          <span className="text-4xl">📤</span>
          <span className="text-base font-bold text-slate-700">
            {selectedFile ? selectedFile.name : 'Click to select prescription or lab report'}
          </span>
          <span className="text-xs text-slate-400">
            Supports PDF, PNG, JPG (Max 10MB)
          </span>
        </label>
      </div>

      {selectedFile && (
        <BigButton
          label="Upload & Run OCR"
          onClick={handleUpload}
          loading={uploading}
          variant="primary"
          className="w-full"
        />
      )}

      {/* OCR Results Preview */}
      {result && (
        <div className="flex flex-col gap-4 rounded-2xl border border-[rgba(31,111,99,0.18)] bg-[rgba(31,111,99,0.06)] p-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--pulse-teal)]">
              OCR Entities Extracted ({result.extracted_entities?.length || 0})
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
              Success
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {result.extracted_entities?.map((ent: any) => (
              <div
                key={ent.id}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                  ent.entity_type === 'medication'
                    ? 'bg-purple-50 border-purple-200 text-purple-800'
                    : ent.entity_type === 'date'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <span>{ent.entity_type === 'medication' ? '💊' : '📊'}</span>
                <span>{ent.entity_value}</span>
                <span className="text-[10px] opacity-60">({Math.round(ent.confidence * 100)}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
