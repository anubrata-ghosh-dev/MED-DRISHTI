'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { BigButton } from '@/components/ui/BigButton';

export default function WelcomePage() {
  const router = useRouter();

  return (
    <KioskWrapper showLanguageTag={false}>
      <div className="flex flex-col items-center text-center gap-8 py-8 animate-fadeIn max-w-xl">
        {/* Main Badge / Icon */}
        <div className="w-28 h-28 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-6xl shadow-2xl shadow-blue-500/30">
          🏥
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            Welcome to Med-Drishti
          </h1>
          <p className="text-xl text-slate-600 font-medium">
            AI-Powered Voice & Touch Clinical Intake
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-4 w-full my-4">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-1">
            <span className="text-2xl">🗣️</span>
            <span className="text-xs font-bold text-slate-700">Voice Guided</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-1">
            <span className="text-2xl">🌐</span>
            <span className="text-xs font-bold text-slate-700">Multi-lingual</span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-1">
            <span className="text-2xl">🔒</span>
            <span className="text-xs font-bold text-slate-700">Confidential</span>
          </div>
        </div>

        {/* CTA Button */}
        <BigButton
          label="Start Check-in / शुरू करें"
          onClick={() => router.push('/language')}
          variant="primary"
          className="w-full text-2xl py-6 rounded-3xl shadow-xl shadow-blue-500/25"
        />
      </div>
    </KioskWrapper>
  );
}
