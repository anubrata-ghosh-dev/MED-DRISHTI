'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { useLanguage, LANGUAGES, Language } from '@/lib/language-context';

export default function LanguagePage() {
  const router = useRouter();
  const { setLanguage } = useLanguage();

  const handleSelect = (code: Language) => {
    setLanguage(code);
    router.push('/register');
  };

  return (
    <KioskWrapper showLanguageTag={false}>
      <div className="w-full max-w-4xl flex flex-col justify-center min-h-[75vh] mx-auto gap-10 py-8">
        <ProgressStepper
          steps={['Language', 'Register', 'Consent', 'Intake']}
          currentStep={0}
        />

        <div className="glass-card rounded-[2rem] p-6 md:p-10">
          {/* Header */}
          <div className="mb-8 text-center animate-fade-slide-up">
            <p
              className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em]"
              style={{ color: 'var(--text-muted)' }}
            >
              Language selection
            </p>
            <h2
              className="text-3xl md:text-4xl"
              style={{ color: 'var(--text-primary)' }}
            >
              Select your language
            </h2>
            <p className="mt-1 text-lg" style={{ color: 'var(--pulse-teal)', fontFamily: 'var(--font-display)' }}>
              भाषा चुनें
            </p>
            <p
              className="mt-3 text-sm md:text-base"
              style={{ color: 'var(--text-secondary)' }}
            >
              Choose the language for your clinical intake experience.
            </p>
          </div>

          {/* Language grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {LANGUAGES.map((lang, i) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code as Language)}
                className="animate-fade-slide-up group relative min-h-[116px] rounded-2xl p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[var(--pulse-teal)] focus:ring-offset-2 focus:ring-offset-[var(--bg-base)]"
                style={{
                  backgroundColor: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  animationDelay: `${i * 50}ms`,
                }}
              >
                {/* Hover teal overlay */}
                <span
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                  style={{ backgroundColor: 'rgba(31,111,99,0.05)' }}
                />

                <span
                  className="relative block text-2xl font-black transition-colors duration-200 md:text-3xl"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {lang.nativeName}
                </span>
                <span
                  className="relative mt-2 block text-[11px] font-bold uppercase tracking-[0.12em] transition-colors duration-200"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {lang.name}
                </span>

                {/* Teal bottom accent on hover */}
                <span
                  className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full transition-all duration-300 group-hover:w-10"
                  style={{ backgroundColor: 'var(--pulse-teal)' }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </KioskWrapper>
  );
}
