/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#930716',
          dark: '#6e0511',
          tint: '#FDF2F3',
        },
        ink: '#0A0A0A',
      },
      fontFamily: {
        display: ["'Playfair Display'", 'Georgia', 'serif'],
        body: ["'Inter'", 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
