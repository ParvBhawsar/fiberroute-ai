/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        fiber: {
          navy: '#0b1f3a',
          blue: '#1769e0',
          cyan: '#0ea5b7',
          green: '#0f9f6e',
          lime: '#84cc16',
          mist: '#eef7f5',
        },
      },
      boxShadow: {
        soft: '0 18px 60px rgba(14, 44, 71, 0.12)',
      },
    },
  },
  plugins: [],
};
