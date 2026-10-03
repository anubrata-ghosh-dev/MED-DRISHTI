'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { BigButton } from '@/components/ui/BigButton';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { getTranslation } from '@/lib/translations';
import { createConsent } from '@/lib/api';

export default function ConsentPage() {
  const router = useRouter();
  const { patientId } = useAuth();
  const { language } = useLanguage();
  const t = getTranslation(language);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAgree = async () => {
    if (!patientId) {
      router.push('/register');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createConsent(patientId, 'data_processing');
      await createConsent(patientId, 'voice_recording');
      router.push('/department');
    } catch (err: any) {
      console.error('Consent error:', err);
      setError('Failed to record consent. Proceeding to department selection.');
      router.push('/department');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    alert('Consent is required to proceed with automated intake.');
    router.push('/');
  };

  return (
    <KioskWrapper>
      <div className="w-full flex flex-col items-center gap-6">
        <ProgressStepper
          steps={[t.stepLanguage, t.stepRegister, t.stepConsent, 'Department', t.stepIntake, 'Records']}
          currentStep={2}
        />

        <div className="text-center space-y-1 mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--pulse-teal)]">
            {t.consentTag}
          </p>
          <h2 className="text-3xl font-extrabold text-slate-800">
            {t.consentTitle}
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            {t.consentSub}
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
            <p>{t.consentPoint1}</p>

            <h4 className="font-bold text-slate-800">2. Security & ABDM Standards</h4>
            <p>{t.consentPoint2}</p>

            <h4 className="font-bold text-slate-800">3. Rights & Consultations</h4>
            <p>{t.consentPoint3}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <BigButton
              label="I Decline"
              onClick={handleDecline}
              variant="secondary"
              className="flex-1"
            />
            <BigButton
              label={t.consentAgreeBtn}
              onClick={handleAgree}
              loading={loading}
              variant="primary"
              className="flex-1 font-bold"
            />
          </div>
        </div>
      </div>
    </KioskWrapper>
  );
}
