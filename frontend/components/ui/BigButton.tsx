'use client';

import React from 'react';

interface BigButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export const BigButton: React.FC<BigButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  type = 'button',
  className = '',
}) => {
  const base = `
    relative min-h-[52px] px-7 py-3.5 rounded-2xl font-bold text-base
    flex items-center justify-center gap-3 select-none
    transition-all duration-200 ease-spring
    focus:outline-none focus:ring-2 focus:ring-offset-2
    focus:ring-offset-[var(--bg-base)]
    active:scale-[0.97]
    disabled:opacity-50 disabled:pointer-events-none
    overflow-hidden
  `;

  const variants: Record<string, string> = {
    primary: `
      bg-[var(--pulse-teal)] text-white
      shadow-[0_4px_16px_rgba(31,111,99,0.30)]
      hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(31,111,99,0.35)]
      focus:ring-[var(--pulse-teal)]
      [data-theme="dark"]:shadow-[0_4px_16px_rgba(45,212,191,0.25)]
      [data-theme="dark"]:hover:shadow-[0_8px_24px_rgba(45,212,191,0.35)]
    `,
    secondary: `
      bg-[var(--glass-bg)] text-[var(--text-primary)]
      border border-[var(--glass-border)]
      backdrop-blur-xl
      shadow-sm
      hover:-translate-y-0.5 hover:bg-[var(--glass-bg-strong)] hover:shadow-md
      focus:ring-[var(--pulse-teal)]
    `,
    danger: `
      bg-[var(--alert-coral)] text-white
      shadow-[0_4px_16px_rgba(196,67,46,0.28)]
      hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(196,67,46,0.36)]
      focus:ring-[var(--alert-coral)]
    `,
    success: `
      bg-[var(--pulse-teal)] text-white
      shadow-[0_4px_16px_rgba(31,111,99,0.30)]
      hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(31,111,99,0.35)]
      focus:ring-[var(--pulse-teal)]
    `,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {/* Shimmer overlay on primary */}
      {variant === 'primary' && !loading && (
        <span
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)',
            backgroundSize: '200% auto',
          }}
        />
      )}

      {loading ? (
        <svg
          className="animate-spin h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon
      )}
      <span>{label}</span>
    </button>
  );
};
