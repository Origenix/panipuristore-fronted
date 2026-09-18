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
          50: '#fdf3f0',
          100: '#fae3da',
          500: '#eb5e28',
          600: '#d14310',
          700: '#ae330e',
        },
        secondary: '#252422',
        accent: '#403d39',
        light: '#fffcf2',
        neutral: '#ccc5b9',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
