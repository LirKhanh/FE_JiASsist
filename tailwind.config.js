/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0065FF',
          hover: '#0052CC',
        },
        secondary: '#DEEBFF',
        bg: '#F4F5F7',
        'text-primary': '#172B4D',
        'text-secondary': '#42526E',
        border: '#DFE1E6',
        success: '#36B37E',
        warning: '#FFAB00',
      },
      borderRadius: {
        'jira': '8px',
      },
      boxShadow: {
        'jira': '0 4px 12px rgba(9, 30, 66, 0.08)',
        'jira-hover': '0 8px 16px rgba(9, 30, 66, 0.12)',
      }
    },
  },
  plugins: [],
}
