/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#090c10',
          900: '#0d1117',
          850: '#131822',
          800: '#181f2c',
          700: '#222b3d',
          600: '#303c54',
          500: '#475569',
        },
        accent: {
          teal: '#14b8a6',
          tealHover: '#0d9488',
          cyan: '#06b6d4',
          blue: '#38bdf8',
          blueHover: '#0284c7',
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

