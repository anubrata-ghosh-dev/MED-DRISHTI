'use client';

import React, { useState } from 'react';

interface VirtualKeyboardProps {
  language: string;
  onKeyPress: (char: string) => void;
  onBackspace: () => void;
  onSpace: () => void;
  onClear: () => void;
  onClose?: () => void;
}

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  language,
  onKeyPress,
  onBackspace,
  onSpace,
  onClear,
  onClose,
}) => {
  const [tab, setTab] = useState<'vowels' | 'consonants' | 'numbers'>('consonants');

  // English QWERTY Layout
  const enLayout = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
  ];

  // Hindi (हिन्दी) Layout
  const hiLayout = {
    vowels: ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ', 'ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ', 'ं', 'ः', 'ँ'],
    consonants: [
      ['क', 'ख', 'ग', 'घ', 'ङ'],
      ['च', 'छ', 'ज', 'झ', 'ञ'],
      ['ट', 'ठ', 'ड', 'ढ', 'ण'],
      ['त', 'थ', 'द', 'ध', 'न'],
      ['प', 'फ', 'ब', 'भ', 'म'],
      ['य', 'र', 'ल', 'व', 'श', 'ष', 'स', 'ह', '़', '्'],
    ],
    numbers: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  };

  // Bengali (বাংলা) Layout
  const bnLayout = {
    vowels: ['অ', 'আ', 'ই', 'ঈ', 'উ', 'ঊ', 'এ', 'ঐ', 'ও', 'ঔ', 'া', 'ি', 'ী', 'ু', 'ূ', 'ে', 'ৈ', 'ো', 'ৌ', 'ং', 'ঃ', 'ঁ'],
    consonants: [
      ['ক', 'খ', 'গ', 'ঘ', 'ঙ'],
      ['চ', 'ছ', 'জ', 'ঝ', 'ঞ'],
      ['ট', 'ঠ', 'ড', 'ঢ', 'ণ'],
      ['ত', 'থ', 'দ', 'ধ', 'ন'],
      ['প', 'ফ', 'ব', 'ভ', 'ম'],
      ['য', 'র', 'ল', 'শ', 'ষ', 'স', 'হ', 'ড়', 'ঢ়', 'য়', '্'],
    ],
    numbers: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  };

  // Tamil (தமிழ்) Layout
  const taLayout = {
    vowels: ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ', 'ா', 'ி', 'ீ', 'ு', 'ூ', 'ெ', 'ே', 'ை', 'ொ', 'ோ', 'ௌ', '்', 'ஃ'],
    consonants: [
      ['க', 'ங', 'ச', 'ஞ', 'ட', 'ண'],
      ['த', 'ந', 'ப', 'ம', 'ய', 'ர'],
      ['ல', 'வ', 'ழ', 'ள', 'ற', 'ன'],
      ['ஜ', 'ஷ', 'ஸ', 'ஹ', 'ஶ'],
    ],
    numbers: ['௦', '௧', '௨', '௩', '௪', '௫', '௬', '௭', '௮', '௯', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  };

  // Malayalam (മലയാളം) Layout
  const mlLayout = {
    vowels: ['അ', 'ആ', 'ഇ', 'ഈ', 'ഉ', 'ഊ', 'എ', 'ഏ', 'ഐ', 'ഒ', 'ഓ', 'ഔ', 'ാ', 'ി', 'ീ', 'ു', 'ൂ', 'െ', 'േ', 'ൈ', 'ൊ', 'ോ', 'ൌ', 'ം', 'ഃ', '്'],
    consonants: [
      ['ക', 'ഖ', 'ഗ', 'ഘ', 'ങ'],
      ['ച', 'ഛ', 'ജ', 'ഝ', 'ഞ'],
      ['ട', 'ഠ', 'ഡ', 'ഢ', 'ണ'],
      ['ത', 'ഥ', 'ദ', 'ധ', 'ന'],
      ['പ', 'ഫ', 'ബ', 'ഭ', 'മ'],
      ['യ', 'ര', 'ല', 'വ', 'ശ', 'ഷ', 'സ', 'ഹ', 'ള', 'ഴ', 'റ'],
    ],
    numbers: ['൦', '൧', '൨', '൩', '൪', '൫', '൬', '൭', '൮', '൯', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  };

  const getLanguageName = () => {
    switch (language) {
      case 'hi': return 'हिन्दी Keyboard';
      case 'bn': return 'বাংলা Keyboard';
      case 'ta': return 'தமிழ் Keyboard';
      case 'ml': return 'മലയാളം Keyboard';
      default: return 'English Keyboard';
    }
  };

  const renderScriptKeys = () => {
    let layout;
    if (language === 'hi') layout = hiLayout;
    else if (language === 'bn') layout = bnLayout;
    else if (language === 'ta') layout = taLayout;
    else if (language === 'ml') layout = mlLayout;
    else return null;

    if (tab === 'vowels') {
      return (
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 p-2">
          {layout.vowels.map((char, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onKeyPress(char)}
              className="h-11 rounded-xl bg-[var(--glass-bg)] border border-[var(--line)] text-lg font-bold text-[var(--text-primary)] shadow-sm hover:bg-[var(--glass-bg-strong)] active:scale-95 transition-all"
            >
              {char}
            </button>
          ))}
        </div>
      );
    }

    if (tab === 'numbers') {
      return (
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 p-2">
          {layout.numbers.map((char, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onKeyPress(char)}
              className="h-11 rounded-xl bg-[var(--glass-bg)] border border-[var(--line)] text-lg font-bold text-[var(--text-primary)] shadow-sm hover:bg-[var(--glass-bg-strong)] active:scale-95 transition-all"
            >
              {char}
            </button>
          ))}
        </div>
      );
    }

    // Default: Consonants
    return (
      <div className="flex flex-col gap-1.5 p-2">
        {layout.consonants.map((row, rIdx) => (
          <div key={rIdx} className="flex justify-center gap-1.5">
            {row.map((char, cIdx) => (
              <button
                key={cIdx}
                type="button"
                onClick={() => onKeyPress(char)}
                className="flex-1 max-w-[50px] h-11 rounded-xl bg-[var(--glass-bg)] border border-[var(--line)] text-lg font-bold text-[var(--text-primary)] shadow-sm hover:bg-[var(--glass-bg-strong)] active:scale-95 transition-all"
              >
                {char}
              </button>
            ))}
          </div>
        ))}
      </div>
    );
  };

  const renderEnglishKeys = () => (
    <div className="flex flex-col gap-1.5 p-2">
      {enLayout.map((row, rIdx) => (
        <div key={rIdx} className="flex justify-center gap-1.5">
          {row.map((char, cIdx) => (
            <button
              key={cIdx}
              type="button"
              onClick={() => onKeyPress(char)}
              className="flex-1 max-w-[46px] h-11 rounded-xl bg-[var(--glass-bg)] border border-[var(--line)] text-lg font-bold text-[var(--text-primary)] shadow-sm hover:bg-[var(--glass-bg-strong)] active:scale-95 transition-all capitalize"
            >
              {char}
            </button>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full bg-[var(--glass-bg-strong)]/95 backdrop-blur-md border border-[var(--line-strong)] rounded-3xl p-3 shadow-2xl flex flex-col gap-2 select-none animate-fadeIn">
      {/* Keyboard Header */}
      <div className="flex items-center justify-between px-2 pb-1 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-[var(--pulse-teal)]">
            ⌨️ {getLanguageName()}
          </span>
        </div>

        {/* Tab Switcher for Indian Scripts */}
        {language !== 'en' && (
          <div className="flex gap-1 bg-[var(--glass-bg)] p-1 rounded-xl border border-[var(--line)] text-xs font-bold">
            <button
              type="button"
              onClick={() => setTab('consonants')}
              className={`px-3 py-1 rounded-lg ${tab === 'consonants' ? 'bg-[var(--pulse-teal)] text-white' : 'text-[var(--text-secondary)]'}`}
            >
              व्यंजन / Main
            </button>
            <button
              type="button"
              onClick={() => setTab('vowels')}
              className={`px-3 py-1 rounded-lg ${tab === 'vowels' ? 'bg-[var(--pulse-teal)] text-white' : 'text-[var(--text-secondary)]'}`}
            >
              स्वर / Vowels
            </button>
            <button
              type="button"
              onClick={() => setTab('numbers')}
              className={`px-3 py-1 rounded-lg ${tab === 'numbers' ? 'bg-[var(--pulse-teal)] text-white' : 'text-[var(--text-secondary)]'}`}
            >
              123
            </button>
          </div>
        )}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 rounded-lg bg-[var(--glass-bg-strong)] hover:bg-slate-300 text-xs font-black text-[var(--text-secondary)]"
          >
            ✖ Close
          </button>
        )}
      </div>

      {/* Main Keys Area */}
      {language === 'en' ? renderEnglishKeys() : renderScriptKeys()}

      {/* Bottom Control Bar */}
      <div className="flex gap-2 px-2 pt-1 border-t border-[var(--line)]">
        <button
          type="button"
          onClick={onClear}
          className="px-4 py-2.5 rounded-xl bg-[var(--glass-bg-strong)] hover:bg-slate-300 text-xs font-extrabold text-[var(--text-secondary)] active:scale-95"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={onSpace}
          className="flex-1 py-2.5 rounded-xl bg-[var(--glass-bg)] border border-[var(--line-strong)] text-xs font-extrabold text-[var(--text-secondary)] shadow-sm hover:bg-[var(--glass-bg-strong)] active:scale-95"
        >
          Space ␣
        </button>
        <button
          type="button"
          onClick={onBackspace}
          className="px-5 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-xs font-extrabold text-amber-900 border border-amber-300 active:scale-95"
        >
          ⌫ Backspace
        </button>
      </div>
    </div>
  );
};
