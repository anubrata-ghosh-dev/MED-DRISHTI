'use client';

import { useLanguage, LANGUAGES } from '@/lib/language-context';

export const LanguageTag: React.FC = () => {
  const { language } = useLanguage();
  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <a
      href="/language"
      className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur border border-slate-200 rounded-full shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
    >
      <span className="text-base">🌐</span>
      <span>{currentLangObj.nativeName}</span>
      <span className="text-xs text-slate-400">({currentLangObj.name})</span>
    </a>
  );
};
