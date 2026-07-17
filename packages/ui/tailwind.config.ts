import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../apps/web/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background, #0b0f19)',
        foreground: 'var(--foreground, #f3f4f6)',
        card: {
          DEFAULT: 'var(--card, #111827)',
          foreground: 'var(--card-foreground, #f3f4f6)',
        },
        primary: {
          DEFAULT: 'var(--primary, #d97706)', // Amber Gold
          foreground: 'var(--primary-foreground, #1e1b4b)',
        },
        secondary: {
          DEFAULT: 'var(--secondary, #312e81)', // Deep Indigo
          foreground: 'var(--secondary-foreground, #f3f4f6)',
        },
        muted: {
          DEFAULT: 'var(--muted, #1f2937)',
          foreground: 'var(--muted-foreground, #9ca3af)',
        },
        accent: {
          DEFAULT: 'var(--accent, #059669)', // Emerald Green
          foreground: 'var(--accent-foreground, #ffffff)',
        },
        border: 'var(--border, #374151)',
      },
      borderRadius: {
        lg: 'var(--radius, 0.5rem)',
        md: 'calc(var(--radius, 0.5rem) - 2px)',
        sm: 'calc(var(--radius, 0.5rem) - 4px)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'fade-in-up': 'fade-in-up 0.7s ease-out forwards',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
