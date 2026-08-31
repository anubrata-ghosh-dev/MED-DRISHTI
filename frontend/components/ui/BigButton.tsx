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
      'bg-primary text-white hover:bg-blue-700 focus:ring-blue-300 shadow-blue-500/20',
    secondary:
      'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400 shadow-slate-500/10',
    danger:
      'bg-danger text-white hover:bg-red-700 focus:ring-red-300 shadow-red-500/20',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-300 shadow-emerald-500/20',
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
