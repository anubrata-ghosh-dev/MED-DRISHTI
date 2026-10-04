'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';

export default function LandingPage() {
  const router = useRouter();

  return (
    <KioskWrapper showLanguageTag={false}>
      <div className="w-full flex flex-col items-center justify-center min-h-[75vh] px-4 animate-fade-slide-up text-center">
        
        {/* Trust Badge */}
        <div className="mb-8">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm"
            style={{
              backgroundColor: 'var(--glass-bg-strong)',
              border: '1px solid var(--pulse-teal)',
              color: 'var(--pulse-teal)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[var(--pulse-teal)] animate-pulse" />
            AI-Assisted Ayurvedic &amp; Clinical Care
          </span>
        </div>

        {/* Main Title Area */}
        <div className="space-y-6 max-w-3xl mx-auto mb-12">
          <h1
            className="text-5xl md:text-7xl font-black leading-tight"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            Welcome to <br className="md:hidden" />
            <span style={{ color: 'var(--pulse-teal)' }}>Med-Drishti</span>
          </h1>
          <p className="text-xl md:text-2xl font-medium max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Your smart, multilingual health assistant. We will help you record your symptoms in your own language before you see the doctor.
          </p>
        </div>

        {/* Call to Action Button */}
        <div className="w-full max-w-md mx-auto space-y-4 mb-16">
          <button
            onClick={() => router.push('/language')}
            className="w-full flex items-center justify-center gap-3 py-6 px-8 rounded-[2rem] shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--pulse-teal)', 
              color: 'white',
              background: 'linear-gradient(135deg, var(--pulse-teal) 0%, #115e59 100%)'
            }}
          >
            <span className="text-2xl md:text-3xl font-extrabold tracking-wide">Start Check-in</span>
            <span className="text-2xl">→</span>
          </button>
          
          <button
            onClick={() => router.push('/hospitals')}
            className="w-full py-4 rounded-2xl text-sm font-bold transition-colors hover:bg-[var(--glass-bg-strong)]"
            style={{ 
              color: 'var(--text-secondary)',
              border: '1px solid var(--glass-border)',
              backgroundColor: 'var(--glass-bg)'
            }}
          >
            🏥 Find Nearby Hospitals
          </button>
        </div>

        {/* Feature Highlights - Centered Below */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          {[
            {
              icon: '🗣️',
              title: 'Speak Naturally',
              desc: 'Use your native language to describe your health issues.'
            },
            {
              icon: '📄',
              title: 'Smart Scanning',
              desc: 'Upload old prescriptions and lab reports instantly.'
            },
            {
              icon: '🌿',
              title: 'Ayurvedic Focus',
              desc: 'Specialized intake for Prakriti & holistic healing.'
            }
          ].map((feature, idx) => (
            <div 
              key={idx}
              className="flex flex-col items-center text-center p-6 rounded-3xl"
              style={{
                backgroundColor: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                backdropFilter: 'blur(12px)'
              }}
            >
              <div className="text-4xl mb-4 p-4 rounded-2xl" style={{ backgroundColor: 'var(--glass-bg-strong)' }}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>{feature.title}</h3>
              <p className="text-sm font-medium leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </KioskWrapper>
  );
}
