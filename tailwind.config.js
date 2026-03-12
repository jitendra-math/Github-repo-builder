/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium dark mode colors
        background: '#000000',
        surface: '#1c1c1e', 
        surfaceHighlight: '#2c2c2e',
        primary: '#0a84ff', 
        textPrimary: '#f5f5f7',
        textSecondary: '#86868b',
        border: '#38383a'
      },
      fontFamily: {
        sans: [
          '-apple-system', 
          'BlinkMacSystemFont', 
          '"Segoe UI"', 
          'Roboto', 
          'Helvetica', 
          'Arial', 
          'sans-serif'
        ],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
