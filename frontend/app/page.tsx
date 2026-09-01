'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { BigButton } from '@/components/ui/BigButton';

const intakeSteps = ['Language', 'Register', 'Consent', 'Intake'];

export default function WelcomePage() {
  const router = useRouter();

  return (
    <KioskWrapper showLanguageTag={false}>
      <div className="w-full max-w-6xl">
        <div className="clinical-card relative overflow-hidden rounded-[2rem] p-5 md:p-8">
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(31,111,99,0.14),transparent_60%)]" />

          <div className="relative grid items-center gap-8 md:grid-cols-[1.25fr_0.75fr]">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--pulse-teal)] text-3xl text-white shadow-lg shadow-[rgba(31,111,99,0.22)]">
                  🏥
                </div>
                <div className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
                  AYUSH & General Care
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl md:text-6xl leading-none text-[var(--chart-ink)]">
                  Welcome to Med-Drishti
                </h1>
                <p className="max-w-xl text-lg text-slate-600 md:text-xl">
                  AI-assisted voice and touch intake designed for fast, safe, multilingual clinical triage.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {['Voice guided', 'Multi-lingual', 'Privacy first'].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-600"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {intakeSteps.map((step, index) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[10px] font-bold text-slate-600">
                      {index + 1}
                    </div>
                    {index < intakeSteps.length - 1 && (
                      <div className="h-px w-8 bg-[var(--line)]" />
                    )}
                  </div>
                ))}
              </div>

              <BigButton
                label="Start check-in / शुरू करें"
                onClick={() => router.push('/language')}
                variant="primary"
                className="mt-2 w-full max-w-md rounded-[1.5rem] text-xl md:text-2xl"
              />
            </div>

            <div className="rounded-[1.75rem] border border-[var(--line)] bg-[rgba(255,255,255,0.74)] p-5 shadow-clinical">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                    Visit summary
                  </p>
                  <h2 className="mt-1 text-2xl text-[var(--chart-ink)]">Today</h2>
                </div>
                <span className="rounded-full bg-[rgba(31,111,99,0.12)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--pulse-teal)]">
                  Ready
                </span>
              </div>

              <div className="space-y-3 border-t border-[var(--line)] pt-4">
                {[
                  ['Patient', 'New check-in'],
                  ['Department', 'General OPD'],
                  ['Document scan', 'Camera / file'],
                  ['Priority review', 'Standard'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-3 py-2.5">
                    <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
                    <span className="text-sm font-semibold text-[var(--chart-ink)]">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-[rgba(216,154,61,0.25)] bg-[rgba(216,154,61,0.08)] p-3 text-sm text-slate-700">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--vitals-amber)]">
                  <span>⚠</span>
                  <span>Safety check</span>
                </div>
                <p className="mt-2 leading-6">
                  Symptoms and urgent red flags are reviewed before the doctor sees the case.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </KioskWrapper>
  );
}
