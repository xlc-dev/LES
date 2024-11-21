/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.svelte"],
  theme: {
    extend: {
      colors: {
        "les-gray": {
          50: "#f4f9fb",
          100: "#edf5f8",
          200: "#dadada",
          300: "#838383",
          400: "#313131",
          500: "#22222c",
          600: "#1a1a26",
          700: "#12121b",
        },
        "les-highlight": "#2a2a3d",
        sidebar: "#111827",
      },
      transitionProperty: {
        width: "width",
      },
    },
  },
};
