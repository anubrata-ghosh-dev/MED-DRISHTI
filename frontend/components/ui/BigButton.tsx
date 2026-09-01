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
  const baseStyles =
    'min-h-[56px] px-8 py-4 rounded-2xl font-bold text-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-4';

  const variantStyles = {
    primary:
      'bg-[var(--pulse-teal)] text-white hover:brightness-110 focus:ring-[rgba(31,111,99,0.24)] shadow-[rgba(31,111,99,0.20)]',
    secondary:
      'bg-slate-200 text-[var(--chart-ink)] hover:bg-slate-300 focus:ring-slate-300 shadow-slate-500/10',
    danger:
      'bg-[var(--alert-coral)] text-white hover:brightness-110 focus:ring-[rgba(196,67,46,0.22)] shadow-[rgba(196,67,46,0.18)]',
    success:
      'bg-[var(--pulse-teal)] text-white hover:brightness-110 focus:ring-[rgba(31,111,99,0.24)] shadow-[rgba(31,111,99,0.20)]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {loading ? (
        <svg
          className="animate-spin h-6 w-6 text-current"
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
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        icon
      )}
      <span>{label}</span>
    </button>
  );
};
