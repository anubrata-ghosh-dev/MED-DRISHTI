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
      <div className="border-2 border-dashed border-slate-300 hover:border-primary rounded-2xl p-6 text-center flex flex-col items-center gap-3 bg-slate-50 hover:bg-blue-50/50 transition-colors">
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
        <div className="p-5 bg-blue-50/50 border border-blue-200 rounded-2xl flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm text-blue-900 uppercase tracking-wider">
              OCR Entities Extracted ({result.extracted_entities?.length || 0})
            </span>
            <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full">
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
