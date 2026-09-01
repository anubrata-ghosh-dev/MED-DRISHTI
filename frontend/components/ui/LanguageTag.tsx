'use client';

import { useLanguage, LANGUAGES } from '@/lib/language-context';

export const LanguageTag: React.FC = () => {
  const { language } = useLanguage();
  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <a
      href="/language"
      className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/85 px-4 py-2 text-sm font-semibold text-[var(--chart-ink)] shadow-sm backdrop-blur hover:bg-white"
    >
      <span className="text-base">🌐</span>
      <span>{currentLangObj.nativeName}</span>
      <span className="text-xs text-slate-500">({currentLangObj.name})</span>
    </a>
  );
};
