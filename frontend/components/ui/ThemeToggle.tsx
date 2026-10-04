'use client';

import React from 'react';
import { useTheme } from '@/lib/theme-context';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="
        relative flex h-9 w-16 items-center rounded-full
        border border-[var(--glass-border)]
        bg-[var(--glass-bg)]
        backdrop-blur-xl
        shadow-sm
        transition-all duration-300
        hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-[var(--pulse-teal)] focus:ring-offset-1
        focus:ring-offset-[var(--bg-base)]
        overflow-hidden
      "
    >
      {/* Track fill */}
      <span
        className={`
          absolute inset-0 rounded-full transition-all duration-300
          ${isDark
            ? 'bg-[rgba(45,212,191,0.15)]'
            : 'bg-[rgba(31,111,99,0.08)]'
          }
        `}
      />

      {/* Thumb */}
      <span
        className={`
          relative z-10 flex h-7 w-7 items-center justify-center
          rounded-full shadow-md
          transition-all duration-300 ease-spring
          ${isDark
            ? 'translate-x-8 bg-[var(--pulse-teal)]'
            : 'translate-x-1 bg-[var(--glass-bg)]'
          }
        `}
      >
        <span
          className={`
            text-sm leading-none select-none
            transition-all duration-300
            ${isDark ? 'rotate-0' : '-rotate-90'}
          `}
          style={{ display: 'block', lineHeight: 1 }}
        >
          {isDark ? '🌙' : '☀️'}
        </span>
      </span>
    </button>
  );
};
