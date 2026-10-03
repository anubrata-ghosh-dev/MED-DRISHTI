'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { BigButton } from '@/components/ui/BigButton';

const intakeSteps = [
  { label: 'Language', emoji: '🌐' },
  { label: 'Register', emoji: '📝' },
  { label: 'Consent', emoji: '✅' },
  { label: 'Department', emoji: '🏥' },
  { label: 'Intake', emoji: '💬' },
];

const features = [
  { emoji: '🎙️', label: 'Voice guided', desc: 'Hands-free AI assistance' },
  { emoji: '🌏', label: 'Multi-lingual', desc: '10+ Indian languages' },
  { emoji: '🔒', label: 'Privacy first', desc: 'End-to-end encrypted' },
];

export default function WelcomePage() {
  const router = useRouter();

  return (
    <KioskWrapper showLanguageTag={false}>
      <div className="w-full max-w-6xl">
        {/* Hero card */}
        <div
          className="glass-card relative overflow-hidden rounded-[2rem] p-6 md:p-10"
          style={{ animationDelay: '0ms' }}
        >
          {/* Subtle inner gradient */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-32 rounded-t-[2rem]"
            style={{
              background: 'radial-gradient(ellipse at top, var(--orb-1), transparent 70%)',
            }}
          />

          <div className="relative grid items-center gap-10 md:grid-cols-[1.3fr_0.7fr]">
            {/* ── Left column ── */}
            <div className="flex flex-col gap-7">
              {/* Brand badge */}
              <div className="animate-fade-slide-up flex items-center gap-3">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl text-white shadow-lg"
                  style={{
                    backgroundColor: 'var(--pulse-teal)',
                    boxShadow: '0 8px 20px rgba(31,111,99,0.30)',
                  }}
                >
                  🏥
                </div>
                <span
                  className="rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{
                    backgroundColor: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-muted)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  AYUSH &amp; General Care
                </span>
              </div>

              {/* Heading */}
              <div className="animate-fade-slide-up delay-100 space-y-3">
                <h1
                  className="text-4xl leading-[1.05] md:text-5xl lg:text-6xl"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Welcome to{' '}
                  <span style={{ color: 'var(--pulse-teal)' }}>Med-Drishti</span>
                </h1>
                <p className="max-w-lg text-lg md:text-xl" style={{ color: 'var(--text-secondary)' }}>
                  AI-assisted voice &amp; touch intake designed for fast, safe, multilingual clinical triage.
                </p>
              </div>

              {/* Feature cards */}
              <div className="animate-fade-slide-up delay-200 flex flex-wrap gap-3">
                {features.map(({ emoji, label, desc }, i) => (
                  <div
                    key={label}
                    className="animate-fade-slide-up flex items-center gap-2.5 rounded-2xl px-4 py-2.5"
                    style={{
                      backgroundColor: 'var(--glass-bg)',
                      border: '1px solid var(--glass-border)',
                      backdropFilter: 'blur(8px)',
                      animationDelay: `${200 + i * 80}ms`,
                    }}
                  >
                    <span className="text-xl">{emoji}</span>
                    <div>
                      <p
                        className="text-xs font-bold uppercase tracking-[0.10em]"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {label}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Step indicator */}
              <div className="animate-fade-slide-up delay-300 flex items-center gap-1.5">
                {intakeSteps.map((step, index) => (
                  <React.Fragment key={step.label}>
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-200"
                      style={{
                        backgroundColor: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-secondary)',
                      }}
                      title={step.label}
                    >
                      {index + 1}
                    </div>
                    {index < intakeSteps.length - 1 && (
                      <div
                        className="h-px flex-1 max-w-[24px]"
                        style={{ backgroundColor: 'var(--line-strong)' }}
                      />
                    )}
                  </React.Fragment>
                ))}
                <span
                  className="ml-2 text-xs font-medium"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {intakeSteps.length} steps
                </span>
              </div>

              {/* CTAs */}
              <div className="animate-fade-slide-up delay-400 flex flex-col gap-3 sm:flex-row">
                <BigButton
                  label="Start check-in / शुरू करें"
                  onClick={() => router.push('/language')}
                  variant="primary"
                  className="flex-1 text-lg"
                />
                <button
                  onClick={() => router.push('/hospitals')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                  style={{
                    backgroundColor: 'var(--glass-bg)',
                    border: '1px solid var(--glass-border)',
                    backdropFilter: 'blur(12px)',
                    color: 'var(--pulse-teal)',
                  }}
                >
                  🏥 Find Nearby Hospitals
                </button>
              </div>
            </div>

            {/* ── Right column: Visit summary card ── */}
            <div
              className="animate-fade-slide-up delay-200 rounded-[1.75rem] p-5"
              style={{
                backgroundColor: 'var(--glass-bg-strong)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: 'var(--glass-shadow)',
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Visit summary
                  </p>
                  <h2
                    className="mt-1 text-2xl"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Today
                  </h2>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{
                    backgroundColor: 'rgba(31,111,99,0.12)',
                    color: 'var(--pulse-teal)',
                  }}
                >
                  Ready
                </span>
              </div>

              <div
                className="space-y-2.5 pt-4"
                style={{ borderTop: '1px solid var(--line)' }}
              >
                {[
                  ['Patient', 'New check-in'],
                  ['Department', 'General OPD'],
                  ['Document scan', 'Camera / file'],
                  ['Priority review', 'Standard'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 rounded-xl px-3 py-2.5"
                    style={{ backgroundColor: 'var(--glass-bg)' }}
                  >
                    <span
                      className="text-[11px] font-bold uppercase tracking-[0.10em]"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {label}
                    </span>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Safety notice */}
              <div
                className="mt-4 rounded-xl p-3"
                style={{
                  backgroundColor: 'rgba(216,154,61,0.08)',
                  border: '1px solid rgba(216,154,61,0.22)',
                }}
              >
                <div
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                  style={{ color: 'var(--vitals-amber)' }}
                >
                  <span>⚠️</span>
                  <span>Safety check</span>
                </div>
                <p
                  className="mt-1.5 text-xs leading-5"
                  style={{ color: 'var(--text-secondary)' }}
                >
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
