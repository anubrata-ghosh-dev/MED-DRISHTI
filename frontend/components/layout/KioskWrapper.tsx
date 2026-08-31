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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative select-none overflow-x-hidden">
      {/* App Header with Mode Switcher */}
      <header className="w-full p-4 flex items-center justify-between z-20 border-b border-slate-200/60 bg-white/70 backdrop-blur-md">
        <a href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center text-xl font-black shadow-lg shadow-blue-500/20">
            🏥
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-slate-900">Med-Drishti</h1>
            <p className="text-xs text-slate-500 font-medium">Clinical Intake System</p>
          </div>
        </a>

        {/* Mode Navigation Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
          <a
            href="/"
            className="px-3 py-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all"
          >
            📱 Kiosk Intake
          </a>
          <a
            href="/triage"
            className="px-3 py-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all"
          >
            🚨 Nurse Triage
          </a>
          <a
            href="/doctor"
            className="px-3 py-1.5 rounded-xl hover:bg-white text-slate-700 hover:text-slate-900 transition-all"
          >
            🩺 Doctor Workspace
          </a>
        </div>

        {showLanguageTag && <LanguageTag />}
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-7xl mx-auto w-full z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full p-4 text-center text-xs text-slate-400 font-medium z-20 flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto border-t border-slate-200/50 mt-4">
        <span>Safe & Confidential • Med-Drishti MVP</span>
        <div className="flex gap-4 mt-2 sm:mt-0 text-slate-500">
          <a href="/" className="hover:underline">Kiosk Mode</a>
          <a href="/triage" className="hover:underline">Triage Alert Feed</a>
          <a href="/doctor" className="hover:underline">Doctor Queue</a>
        </div>
      </footer>
    </div>
  );
};
