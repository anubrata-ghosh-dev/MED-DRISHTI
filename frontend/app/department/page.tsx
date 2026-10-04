'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { KioskWrapper } from '@/components/layout/KioskWrapper';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { useAuth } from '@/lib/auth-context';

interface DepartmentOption {
  id: string;
  name: string;
  hindiName: string;
  icon: string;
  description: string;
  badge?: string;
  isAyush?: boolean;
}

const DEPARTMENTS: DepartmentOption[] = [
  {
    id: 'general',
    name: 'General OPD',
    hindiName: 'सामान्य ओपीडी',
    icon: '🏥',
    description: 'Fever, cough, cold, weakness & routine consultation',
  },
  {
    id: 'cardiology',
    name: 'Cardiology',
    hindiName: 'हृदय रोग',
    icon: '❤️',
    description: 'Chest discomfort, heart rate, blood pressure & ECG review',
  },
  {
    id: 'ayurveda',
    name: 'Ayurveda (AYUSH)',
    hindiName: 'आयुर्वेद (आयुष)',
    icon: '🧘',
    description: 'Prakriti analysis, herbal remedies & lifestyle consultation',
    badge: 'AYUSH System',
    isAyush: true,
  },
  {
    id: 'pulmonology',
    name: 'Pulmonology',
    hindiName: 'श्वसन रोग',
    icon: '🫁',
    description: 'Breathing difficulty, persistent cough, asthma & lung care',
  },
  {
    id: 'neurology',
    name: 'Neurology',
    hindiName: 'न्यूरोलॉजी',
    icon: '🧠',
    description: 'Severe headache, migraine, dizziness, tremors & nerves',
  },
  {
    id: 'orthopaedics',
    name: 'Orthopaedics',
    hindiName: 'हड्डी रोग',
    icon: '🦴',
    description: 'Joint aches, back pain, bone fracture & mobility issues',
  },
];

export default function DepartmentPage() {
  const router = useRouter();
  const { setDepartment } = useAuth();

  const handleSelectDepartment = (dept: DepartmentOption) => {
    try {
      // Save department to localStorage as 'md_department'
      localStorage.setItem('md_department', dept.name);
      // Save to auth context if available
      if (setDepartment) {
        setDepartment(dept.name);
      }
    } catch (e) {
      console.warn('Failed to persist department:', e);
    }

    // If department is 'Ayurveda', navigate to /intake?mode=ayush
    if (dept.id === 'ayurveda' || dept.name.includes('Ayurveda') || dept.isAyush) {
      router.push('/intake?mode=ayush');
    } else {
      router.push('/intake');
    }
  };

  return (
    <KioskWrapper>
      <div className="w-full flex flex-col items-center justify-center min-h-[75vh] gap-10 py-8 animate-fadeIn">
        <ProgressStepper
          steps={['Language', 'Register', 'Consent', 'Department', 'Intake', 'Records']}
          currentStep={3}
        />

        {/* Title Header */}
        <div className="text-center space-y-2 mb-2 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--pulse-teal)]">
            Step 4 • Department Selection / चरण 4
          </p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--chart-ink)]">
            Select Your Department / अपना विभाग चुनें
          </h1>
          <p className="text-[var(--text-muted)] font-medium text-sm md:text-base">
            Tap a department below to begin your automated clinical intake.
          </p>
        </div>

        {/* 2x3 Department Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() => handleSelectDepartment(dept)}
              className="clinical-card group relative flex min-h-[140px] md:min-h-[150px] flex-col items-center justify-center rounded-3xl border border-[var(--line)] bg-[var(--glass-bg)]/80 p-6 text-center shadow-clinical transition-all duration-200 hover:-translate-y-1 hover:border-[var(--pulse-teal)] hover:bg-[var(--glass-bg)] hover:shadow-xl active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[rgba(31,111,99,0.20)]"
            >
              {dept.badge && (
                <div className="absolute top-3 right-3 rounded-full bg-[rgba(31,111,99,0.12)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--pulse-teal)]">
                  {dept.badge}
                </div>
              )}

              <span className="text-4xl md:text-5xl mb-2 transition-transform duration-200 group-hover:scale-110">
                {dept.icon}
              </span>

              <h3 className="text-xl font-extrabold text-[var(--text-primary)] transition-colors group-hover:text-[var(--pulse-teal)]">
                {dept.name}
              </h3>

              <p className="text-sm font-semibold text-[var(--text-muted)] mt-0.5">
                {dept.hindiName}
              </p>

              <p className="text-xs text-slate-400 mt-2 font-medium leading-tight line-clamp-2">
                {dept.description}
              </p>
            </button>
          ))}
        </div>

        {/* Bottom Help / Info Notice */}
        <div className="mt-2 text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Unsure which department to choose? Select{' '}
            <span className="font-bold text-[var(--pulse-teal)]">General OPD</span> for a general checkup.
          </p>
        </div>
      </div>
    </KioskWrapper>
  );
}
