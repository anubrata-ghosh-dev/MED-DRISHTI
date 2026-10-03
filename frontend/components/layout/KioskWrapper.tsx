'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LanguageTag } from '../ui/LanguageTag';
import { ThemeToggle } from '../ui/ThemeToggle';

interface KioskWrapperProps {
  children: React.ReactNode;
  showLanguageTag?: boolean;
}

export const KioskWrapper: React.FC<KioskWrapperProps> = ({
  children,
  showLanguageTag = true,
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Disable right click context menu in kiosk mode
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col relative select-none overflow-x-hidden"
      style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* Ambient orb layer */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full animate-orb"
          style={{
            background: 'radial-gradient(circle, var(--orb-1) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full animate-orb"
          style={{
            background: 'radial-gradient(circle, var(--orb-2) 0%, transparent 70%)',
            filter: 'blur(60px)',
            animationDelay: '-5s',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full animate-orb"
          style={{
            background: 'radial-gradient(circle, var(--orb-3) 0%, transparent 70%)',
            filter: 'blur(50px)',
            animationDelay: '-9s',
          }}
        />
      </div>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 w-full transition-all duration-300"
        style={{
          backgroundColor: scrolled ? 'var(--glass-bg-strong)' : 'var(--glass-bg)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid var(--glass-border)',
          boxShadow: scrolled
            ? '0 4px 24px rgba(0,0,0,0.08)'
            : 'none',
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-white shadow-md transition-transform duration-200 group-hover:scale-105"
              style={{ backgroundColor: 'var(--pulse-teal)' }}
            >
              🏥
            </div>
            <div>
              <h1
                className="text-base font-bold leading-tight tracking-tight"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display), Georgia, serif' }}
              >
                Med-Drishti
              </h1>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: 'var(--text-muted)' }}
              >
                Clinical Intake System
              </p>
            </div>
          </Link>

          {/* Nav links */}
          <nav
            className="hidden items-center gap-0.5 rounded-2xl p-1 text-xs font-semibold md:flex"
            style={{
              backgroundColor: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            {[
              { href: '/', label: 'Kiosk Intake', emoji: '📱' },
              { href: '/triage', label: 'Nurse Triage', emoji: '🚨' },
              { href: '/doctor', label: 'Doctor Workspace', emoji: '🩺' },
            ].map(({ href, label, emoji }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 transition-all duration-150 hover:bg-[var(--glass-bg-strong)]"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right: Language tag + theme toggle */}
          <div className="flex items-center gap-2">
            {showLanguageTag && <LanguageTag />}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full animate-fade-slide-up">
          {children}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        className="relative z-10 mx-auto mt-4 flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 sm:flex-row sm:text-left md:px-8"
        style={{
          borderTop: '1px solid var(--line)',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          fontWeight: 500,
        }}
      >
        <span>Safe &amp; Confidential • Med-Drishti MVP</span>
        <div className="flex gap-4">
          {[
            { href: '/', label: 'Kiosk Mode' },
            { href: '/triage', label: 'Triage Alert Feed' },
            { href: '/doctor', label: 'Doctor Queue' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="transition-colors duration-150 hover:text-[var(--text-primary)]"
            >
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
};
