/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hisaab: {
          primary: '#087F5B',
          'primary-dark': '#066348',
          mint: '#E8F5EE',
          bg: '#F8FAF8',
          card: '#FFFFFF',
          text: '#17231E',
          muted: '#64748B',
          border: '#E5EAE7',
          credit: '#16A36A',
          payment: '#E76F51',
          warning: '#F59E0B',
          error: '#DC2626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        'card': '16px',
        'btn': '12px',
        'inp': '12px',
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(23, 35, 30, 0.05), 0 1px 3px -1px rgba(23, 35, 30, 0.05)',
        'elevated': '0 10px 25px -5px rgba(8, 127, 91, 0.08), 0 8px 10px -6px rgba(8, 127, 91, 0.04)',
      }
    },
  },
  plugins: [],
}
