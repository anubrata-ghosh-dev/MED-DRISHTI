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
      <div className="w-full max-w-4xl">
        <ProgressStepper
          steps={['Language', 'Register', 'Consent', 'Intake']}
          currentStep={0}
        />

        <div className="clinical-card rounded-[2rem] p-6 md:p-8">
          <div className="mb-6 text-center">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Language selection
            </p>
            <h2 className="text-3xl text-[var(--chart-ink)] md:text-4xl">
              Select your language / भाषा चुनें
            </h2>
            <p className="mt-2 text-sm text-slate-600 md:text-base">
              Choose the language you want for your clinical intake experience.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code as Language)}
                className="group min-h-[126px] rounded-[1.5rem] border border-[var(--line)] bg-white/80 p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--pulse-teal)] hover:bg-[rgba(31,111,99,0.04)] hover:shadow-lg active:scale-[0.99]"
              >
                <span className="block text-2xl font-black text-[var(--chart-ink)] transition-colors group-hover:text-[var(--pulse-teal)] md:text-3xl">
                  {lang.nativeName}
                </span>
                <span className="mt-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 group-hover:text-[var(--pulse-teal)]">
                  {lang.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </KioskWrapper>
  );
}
