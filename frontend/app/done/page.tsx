'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { BigButton } from '@/components/ui/BigButton';

export default function DonePage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(15);

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
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-5xl">
          ✓
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-800">
            Intake Complete!
          </h2>
          <p className="text-slate-600 text-base font-medium">
            Thank you for providing your information. A physician or nurse will see you shortly.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl w-full text-sm font-semibold text-slate-600">
          Screen resets in <span className="text-primary font-bold">{countdown}</span> seconds for next patient.
        </div>

        <BigButton
          label="Return to Start"
          onClick={() => router.push('/')}
          variant="primary"
          className="w-full"
        />
      </div>
    </KioskWrapper>
  );
}
