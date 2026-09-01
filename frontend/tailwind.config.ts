import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1F6F63',
        danger: '#C4432E',
        surface: '#EDF1EE',
        ink: '#16241F',
        amber: '#D89A3D',
        sage: '#6E8B74',
        mist: '#EDF1EE',
      },
      boxShadow: {
        clinical: '0 18px 40px rgba(22, 36, 31, 0.08)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['IBM Plex Sans', 'Noto Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
