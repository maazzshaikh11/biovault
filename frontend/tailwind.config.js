/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050a0f",
        surface: "#0b1420",
        surface2: "#0f1e30",
        border: "#1a3a5c",
        accent: "#00e5ff",
        accent2: "#00ff9d",
        danger: "#ff3860",
        warn: "#ffb300",
        text: "#c8e6f7",
        muted: "#4a7a9b",
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 24px rgba(0,229,255,0.25)',
        glow2: '0 0 16px rgba(0,255,157,0.2)',
      }
    },
  },
  plugins: [],
}
