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
  return (
    <div className="w-full max-w-2xl mx-auto mb-8 px-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 z-0" />

        <div
          className="absolute top-1/2 left-0 h-1 bg-[var(--pulse-teal)] -translate-y-1/2 z-0 transition-all duration-300"
          style={{
            width: `${(currentStep / Math.max(steps.length - 1, 1)) * 100}%`,
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step}
              className="relative z-10 flex flex-col items-center gap-2"
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[var(--pulse-teal)] text-white ring-4 ring-[rgba(31,111,99,0.18)]'
                    : isCurrent
                    ? 'bg-white border-2 border-[var(--pulse-teal)] text-[var(--pulse-teal)] ring-4 ring-[rgba(31,111,99,0.12)]'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : index + 1}
              </div>
              <span
                className={`text-xs font-semibold whitespace-nowrap ${
                  isCurrent || isCompleted ? 'text-slate-800' : 'text-slate-400'
                }`}
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
