import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#070708',
        surface: '#0f1014',
        border: '#1f2128',
        muted: '#8b8d98',
        accent: {
          gold: '#facc15',
          silver: '#e5e7eb',
          bronze: '#b45309',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
