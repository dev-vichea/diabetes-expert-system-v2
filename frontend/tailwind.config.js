import animate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f4f8fc',
        muted: {
          DEFAULT: '#94a3b8',
          foreground: '#475569',
        },
        primary: {
          50: '#f0f7ff',
          100: '#dcebff',
          500: '#2f8cff',
          600: '#1f76e8',
          700: '#175bb7',
        },
        success: {
          50: '#ecfdf3',
          500: '#16a34a',
          600: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#d97706',
          600: '#b45309',
        },
        danger: {
          50: '#fff1f2',
          500: '#e11d48',
          600: '#be123c',
        },
      },
      boxShadow: {
        soft: '0 10px 25px -15px rgba(13, 42, 74, 0.35)',
      },
      fontFamily: {
        sans: ['var(--app-font-sans)', 'Manrope', 'Noto Sans Khmer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [animate],
}
