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
    },
  },
  plugins: [],
};

export default config;
