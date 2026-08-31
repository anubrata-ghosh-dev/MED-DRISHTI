'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { BigButton } from '@/components/ui/BigButton';
import { useAuth } from '@/lib/auth-context';
import { createConsent } from '@/lib/api';

export default function ConsentPage() {
  const router = useRouter();
  const { patientId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAgree = async () => {
    if (!patientId) {
      // If no patientId in state, fallback or redirect
      router.push('/register');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createConsent(patientId, 'data_processing');
      await createConsent(patientId, 'voice_recording');
      router.push('/intake');
    } catch (err: any) {
      console.error('Consent error:', err);
      setError('Failed to record consent. Proceeding to intake.');
      // Still allow proceeding for kiosk ease
      router.push('/intake');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    alert('Consent is required to proceed with automated intake. Please inform clinic staff for manual registration.');
    router.push('/');
  };

  return (
    <KioskWrapper>
      <div className="w-full flex flex-col items-center gap-6">
        <ProgressStepper
          steps={['Language', 'Register', 'Consent', 'Intake']}
          currentStep={2}
        />

        <div className="text-center space-y-1 mb-2">
          <h2 className="text-3xl font-extrabold text-slate-800">
            Privacy & Consent Notice
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            Please read and agree to continue your check-in
          </p>
        </div>

        <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col gap-6">
          {error && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium">
              {error}
            </div>
          )}

          <div className="h-48 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm text-slate-600 leading-relaxed space-y-3">
            <h4 className="font-bold text-slate-800">1. Data Collection & Processing</h4>
            <p>
              By agreeing, you permit Med-Drishti to collect your symptoms, clinical history, and basic health information to assist hospital clinical staff in triaging your visit.
            </p>

            <h4 className="font-bold text-slate-800">2. Voice Recording</h4>
            <p>
              Audio recordings of your responses will be transcribed to text using AI models. Original audio is processed securely and protected under hospital privacy standards.
            </p>

            <h4 className="font-bold text-slate-800">3. Data Security & Confidentiality</h4>
            <p>
              Your data is stored securely in compliance with applicable healthcare privacy guidelines and will only be accessed by authorized attending healthcare professionals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <BigButton
              label="I Decline"
              onClick={handleDecline}
              variant="secondary"
              className="flex-1"
            />
            <BigButton
              label="I Agree & Continue"
              onClick={handleAgree}
              loading={loading}
              variant="primary"
              className="flex-1"
            />
          </div>
        </div>
      </div>
    </KioskWrapper>
  );
}
