// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }


/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#004368', light: '#1E6BB5', dark: '#0A3260', text: '#272727' },
        accent: { DEFAULT: '#F59E0B', light: '#FCD34D' },
        surface: { DEFAULT: '#F8FAFC', card: '#E6ECF0', border: '#E2E8F0' },
        sidebar: { DEFAULT: '#0D1B2A', hover: '#1A2E47' },

      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}