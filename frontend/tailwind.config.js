/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./src/**/*.svelte", "./index.html"],
  theme: {
    extend: {
      colors: {
        "les-blue": "#1565c0",
        "les-red": "#f23f44",
        "les-red-dark": "#610000",
        "les-bg": "#1e1e2d",
        "les-bg-dark": "#12121B",
        "les-highlight": "#2a2a3d",
        "les-frame": "#dadada",
        "les-table-cell": "#373737"
      },
      transitionProperty: {
        width: "width",
      },
    },
  },
  plugins: [],
};
