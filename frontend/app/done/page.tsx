'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { BigButton } from '@/components/ui/BigButton';
import { useLanguage } from '@/lib/language-context';
import { getTranslation } from '@/lib/translations';

export default function DonePage() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = getTranslation(language);

  const [countdown, setCountdown] = useState(15);
  const [sessionCleared, setSessionCleared] = useState(false);

  // Kiosk session cleanup after 1 second
  useEffect(() => {
    const cleanupTimer = setTimeout(() => {
      try {
        localStorage.removeItem('md_patient_id');
        localStorage.removeItem('md_session_id');
        localStorage.removeItem('md_language');
        localStorage.removeItem('md_department');
        sessionStorage.clear();
        setSessionCleared(true);
      } catch (err) {
        console.error('Failed to clean up kiosk session:', err);
      }
    }, 1000);

    return () => clearTimeout(cleanupTimer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <KioskWrapper showLanguageTag={false}>
      <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center gap-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-5xl font-black">
          ✓
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--pulse-teal)]">
            {t.doneTag}
          </p>
          <h2 className="text-3xl font-black text-slate-800">
            {t.doneTitle}
          </h2>
          <p className="text-slate-600 text-base font-medium">
            {t.doneSub}
          </p>
        </div>

        {/* Kiosk session secure cleanup message */}
        <div className="w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 shadow-sm">
          <span>🔒</span>
          <span>Your session has been securely cleared.</span>
        </div>

        <div className="w-full rounded-2xl border border-[var(--line)] bg-slate-50 p-4 text-sm font-semibold text-slate-600">
          Resetting in <span className="font-bold text-[var(--pulse-teal)]">{countdown}</span>s
        </div>

        <BigButton
          label={t.doneHomeBtn}
          onClick={() => router.push('/')}
          variant="primary"
          className="w-full font-bold"
        />
      </div>
    </KioskWrapper>
  );
}
