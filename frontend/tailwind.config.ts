import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        work: {
          bg: 'var(--color-work-bg)',
          card: 'var(--color-work-card)',
          accent: 'var(--color-work-accent)',
        },
        break: {
          bg: 'var(--color-break-bg)',
          card: 'var(--color-break-card)',
          accent: 'var(--color-break-accent)',
        },
        surface: 'var(--color-surface)',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
