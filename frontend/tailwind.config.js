/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Medical Emerald / Teal
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        medicare: {
          blue: '#0284c7',
          dark: '#0f172a',
          slate: '#334155',
          light: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
