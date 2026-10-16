/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAF6EE',
          dark: '#181714',
        },
        surface: {
          DEFAULT: '#FFFDF8',
          dark: '#23211D',
        },
        ink: {
          DEFAULT: '#1C1B17',
          light: '#4A463F',
          muted: '#787268',
          faint: '#A8A297',
        },
        borderWarm: {
          DEFAULT: '#E4DCC9',
          dark: '#38342D',
        },
        forest: {
          DEFAULT: '#2F5233',
          hover: '#244027',
          light: '#EEF3EE',
          subtle: '#D9E5DA',
          dark: '#689D6A',
        },
        burnt: {
          DEFAULT: '#C2572B',
          hover: '#A94821',
          light: '#FAEEE8',
          subtle: '#F4D8CC',
          dark: '#E07A5F',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Lora', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}
