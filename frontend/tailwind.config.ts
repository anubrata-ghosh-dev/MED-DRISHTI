import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--pulse-teal)',
        danger: 'var(--alert-coral)',
        surface: 'var(--bg-base)',
        ink: 'var(--text-primary)',
        amber: 'var(--vitals-amber)',
        sage: '#6E8B74',
        mist: '#EDF1EE',
      },
      boxShadow: {
        clinical: '0 18px 40px rgba(22, 36, 31, 0.08)',
        glass: 'var(--glass-shadow)',
        'glow-teal': '0 0 20px rgba(31, 111, 99, 0.30), 0 4px 12px rgba(31, 111, 99, 0.15)',
        'glow-red': '0 0 20px rgba(196, 67, 46, 0.30), 0 4px 12px rgba(196, 67, 46, 0.15)',
        'glow-amber': '0 0 20px rgba(216, 154, 61, 0.30), 0 4px 12px rgba(216, 154, 61, 0.15)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans', 'Noto Sans', 'sans-serif'],
      },
      keyframes: {
        fadeSlideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(31, 111, 99, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(31, 111, 99, 0)' },
        },
        orbFloat: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -20px) scale(1.05)' },
          '66%': { transform: 'translate(-20px, 15px) scale(0.95)' },
        },
      },
      animation: {
        'fade-slide-up': 'fadeSlideUp 0.5s ease both',
        'fade-in': 'fadeIn 0.4s ease both',
        float: 'float 4s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'orb-float': 'orbFloat 12s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
