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
      <div className="w-full flex flex-col items-center gap-6">
        <ProgressStepper
          steps={['Language', 'Register', 'Consent', 'Intake']}
          currentStep={0}
        />

        <div className="text-center space-y-2 mb-4">
          <h2 className="text-3xl font-extrabold text-slate-800">
            Select Your Language / भाषा चुनें
          </h2>
          <p className="text-slate-500 font-medium">
            Choose the language you prefer for your intake
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code as Language)}
              className="p-6 bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-primary rounded-3xl flex flex-col items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all duration-200 group active:scale-95 text-center min-h-[120px]"
            >
              <span className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors">
                {lang.nativeName}
              </span>
              <span className="text-xs font-semibold text-slate-400 group-hover:text-blue-600">
                {lang.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </KioskWrapper>
  );
}
