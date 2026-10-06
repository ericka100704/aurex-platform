/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand accent — deep violet from SOLANA logo nebula
        gold: {
          DEFAULT: "#8A2BE2",
          50: "#F3E8FF",
          100: "#E9D5FF",
          200: "#D8B4FE",
          300: "#C084FC",
          400: "#A855F7",
          500: "#8A2BE2",
          600: "#6B21A8",
          700: "#581C87",
          800: "#3B0764",
          900: "#2E0854",
        },
        rose: {
          DEFAULT: "#9D4EDD",
          50: "#FAF5FF",
          100: "#F3E8FF",
          200: "#E9D5FF",
          300: "#D8B4FE",
          400: "#C084FC",
          500: "#9D4EDD",
          600: "#7B2CBF",
          700: "#5A189A",
          800: "#3C096C",
          900: "#240046",
        },
        magenta: {
          DEFAULT: "#8A2BE2",
          400: "#BF00FF",
          500: "#8A2BE2",
          600: "#6B21A8",
        },
        dark: {
          DEFAULT: "#0D0D0D",
          50: "#2A2A2A",
          100: "#242424",
          200: "#1E1E1E",
          300: "#181818",
          400: "#121212",
          500: "#0D0D0D",
          600: "#0A0A0A",
          700: "#080808",
          800: "#050505",
          900: "#000000",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        brand: ["var(--font-brand)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gold-gradient":
          "linear-gradient(135deg, #5A189A 0%, #8A2BE2 45%, #3C096C 100%)",
        "rose-gradient":
          "linear-gradient(135deg, #6B21A8 0%, #9D4EDD 50%, #4B0082 100%)",
        "luxury-gradient":
          "linear-gradient(135deg, #3C096C 0%, #8A2BE2 50%, #5A189A 100%)",
        "dark-radial":
          "radial-gradient(ellipse at top, #1A0A2E 0%, #0D0D0D 60%)",
        "mesh-glow":
          "linear-gradient(135deg, #8A2BE2 0%, #5A189A 55%, #2E0854 100%)",
        "pink-glow":
          "linear-gradient(135deg, #9D4EDD 0%, #8A2BE2 45%, #4B0082 100%)",
        "nav-active":
          "linear-gradient(90deg, rgba(138,43,226,0.55) 0%, rgba(90,24,154,0.3) 55%, rgba(13,13,13,0.2) 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.37)",
        gold: "0 0 20px rgba(138, 43, 226, 0.35)",
        rose: "0 0 18px rgba(157, 78, 221, 0.35)",
        luxury: "0 10px 40px rgba(75, 0, 130, 0.28)",
        glow: "0 0 28px rgba(138, 43, 226, 0.4)",
        "glow-soft": "0 0 40px rgba(90, 24, 154, 0.3)",
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
        "fade-up": "fadeUp 0.6s ease-out forwards",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
