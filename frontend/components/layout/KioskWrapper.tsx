'use client';

import React, { useEffect } from 'react';
import { LanguageTag } from '../ui/LanguageTag';

interface KioskWrapperProps {
  children: React.ReactNode;
  showLanguageTag?: boolean;
}

export const KioskWrapper: React.FC<KioskWrapperProps> = ({
  children,
  showLanguageTag = true,
}) => {
  useEffect(() => {
    // Disable right click context menu in kiosk mode
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[var(--clinical-mist)] text-[var(--chart-ink)] flex flex-col relative select-none overflow-x-hidden">
      <header className="w-full border-b border-[var(--line)] bg-white/70 backdrop-blur-md z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <a href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--pulse-teal)] text-xl font-black text-white shadow-lg shadow-[rgba(31,111,99,0.18)]">
              🏥
            </div>
            <div>
              <h1 className="text-lg leading-tight text-[var(--chart-ink)]">Med-Drishti</h1>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                Clinical Intake System
              </p>
            </div>
          </a>

          <div className="hidden items-center gap-1 rounded-2xl border border-[var(--line)] bg-slate-100/90 p-1.5 text-xs font-bold md:flex">
            <a
              href="/"
              className="rounded-xl px-3 py-1.5 text-slate-700 hover:bg-white hover:text-[var(--chart-ink)]"
            >
              📱 Kiosk Intake
            </a>
            <a
              href="/triage"
              className="rounded-xl px-3 py-1.5 text-slate-700 hover:bg-white hover:text-[var(--chart-ink)]"
            >
              🚨 Nurse Triage
            </a>
            <a
              href="/doctor"
              className="rounded-xl px-3 py-1.5 text-slate-700 hover:bg-white hover:text-[var(--chart-ink)]"
            >
              🩺 Doctor Workspace
            </a>
          </div>

          {showLanguageTag && <LanguageTag />}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center p-4 md:p-8 z-10">
        {children}
      </main>

      <footer className="mx-auto mt-4 flex w-full max-w-7xl flex-col items-center justify-between gap-2 border-t border-[var(--line)] px-4 py-4 text-center text-xs font-medium text-slate-500 sm:flex-row sm:text-left md:px-8">
        <span>Safe & Confidential • Med-Drishti MVP</span>
        <div className="flex gap-4">
          <a href="/" className="hover:text-[var(--chart-ink)]">Kiosk Mode</a>
          <a href="/triage" className="hover:text-[var(--chart-ink)]">Triage Alert Feed</a>
          <a href="/doctor" className="hover:text-[var(--chart-ink)]">Doctor Queue</a>
        </div>
      </footer>
    </div>
  );
};
