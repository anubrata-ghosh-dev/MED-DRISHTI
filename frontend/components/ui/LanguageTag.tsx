'use client';

import React from 'react';
import { useLanguage, LANGUAGES } from '@/lib/language-context';

export const LanguageTag: React.FC = () => {
  const { language } = useLanguage();
  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <a
      href="/language"
      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--pulse-teal)] focus:ring-offset-1 focus:ring-offset-[var(--bg-base)]"
      style={{
        backgroundColor: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: 'var(--text-primary)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <span className="text-base leading-none">🌐</span>
      <span>{currentLangObj.nativeName}</span>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
        ({currentLangObj.name})
      </span>
    </a>
  );
};
