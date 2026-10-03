'use client';

import React from 'react';

interface ProgressStepperProps {
  steps: string[];
  currentStep: number;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStep,
}) => {
  const progress = (currentStep / Math.max(steps.length - 1, 1)) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4 animate-fade-in">
      <div className="flex items-center justify-between relative">
        {/* Track background */}
        <div
          className="absolute top-5 left-0 right-0 h-0.5 -translate-y-1/2 z-0"
          style={{ backgroundColor: 'var(--line-strong)' }}
        />

        {/* Animated fill */}
        <div
          className="absolute top-5 left-0 h-0.5 -translate-y-1/2 z-0 transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: 'var(--pulse-teal)',
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step}
              className="relative z-10 flex flex-col items-center gap-2"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  font-bold text-sm transition-all duration-300
                  ${isCompleted
                    ? 'text-white shadow-lg'
                    : isCurrent
                    ? 'font-extrabold'
                    : ''
                  }
                `}
                style={{
                  backgroundColor: isCompleted
                    ? 'var(--pulse-teal)'
                    : isCurrent
                    ? 'var(--glass-bg-strong)'
                    : 'var(--glass-bg)',
                  border: isCompleted
                    ? '2px solid var(--pulse-teal)'
                    : isCurrent
                    ? '2px solid var(--pulse-teal)'
                    : '2px solid var(--line-strong)',
                  color: isCompleted
                    ? 'white'
                    : isCurrent
                    ? 'var(--pulse-teal)'
                    : 'var(--text-muted)',
                  boxShadow: isCurrent
                    ? '0 0 0 4px rgba(31, 111, 99, 0.15)'
                    : isCompleted
                    ? '0 4px 12px rgba(31, 111, 99, 0.30)'
                    : 'none',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                }}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className="text-xs font-semibold whitespace-nowrap transition-colors duration-200"
                style={{
                  color: isCurrent || isCompleted
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                  fontWeight: isCurrent ? 700 : 600,
                }}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
