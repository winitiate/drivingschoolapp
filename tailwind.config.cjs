/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: "#2563eb",
          "primary-content": "#ffffff",
          secondary: "#d97706",
          "secondary-content": "#ffffff",
          accent: "#22c55e",
          "accent-content": "#ffffff",
          neutral: "#3d4451",
          "neutral-content": "#ffffff",
          "base-100": "#f9fafb",
          "base-content": "#1f2937",
          info: "#3abff8",
          success: "#36d399",
          warning: "#fbbd23",
          error: "#f87272",
        },
      },
      "light",
      "dark",
    ],
  },
};
