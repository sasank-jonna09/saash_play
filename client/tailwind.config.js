/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        'sv-bg': '#fcfcfd', // Crisp white background
        'sv-surface': '#ffffff', // Pure white
        'sv-card': '#f8fafc',
        'sv-border': '#e2e8f0',
        'sv-accent': '#6366f1', // Vibrant indigo
        'sv-accent-dim': '#e0e7ff',
        'sv-green': '#10b981', // Vibrant emerald
        'sv-yellow': '#f59e0b',
        'sv-red': '#ef4444',
        'sv-text': '#0f172a',
        'sv-muted': '#64748b'
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'float': '0 20px 40px -10px rgba(99, 102, 241, 0.15)',
        'inner-light': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.3)',
      }
    },
  },
  plugins: [],
}

