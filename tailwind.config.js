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
        gold: {
          DEFAULT: "#D4AF37",
          50: "#FBF6E6",
          100: "#F5EBC3",
          200: "#EBD787",
          300: "#E0C34B",
          400: "#D4AF37",
          500: "#B8941F",
          600: "#957818",
          700: "#725C12",
          800: "#4F400C",
          900: "#2C2407",
        },
        rose: {
          DEFAULT: "#FF4DA6",
          50: "#FFF0F7",
          100: "#FFE0EF",
          200: "#FFB3D9",
          300: "#FF80C3",
          400: "#FF4DA6",
          500: "#FF2E96",
          600: "#E0187A",
          700: "#B8005C",
          800: "#8A0046",
          900: "#5C002E",
        },
        magenta: {
          DEFAULT: "#FF69B4",
          400: "#FF69B4",
          500: "#E84AA0",
          600: "#8A2BE2",
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
          "linear-gradient(135deg, #D4AF37 0%, #F5EBC3 50%, #B8941F 100%)",
        "rose-gradient":
          "linear-gradient(135deg, #C9A227 0%, #E8D48B 50%, #B8941F 100%)",
        "luxury-gradient":
          "linear-gradient(135deg, #B8941F 0%, #F5EBC3 50%, #D4AF37 100%)",
        "dark-radial":
          "radial-gradient(ellipse at top, #1E1E1E 0%, #0D0D0D 60%)",
        "mesh-glow":
          "linear-gradient(135deg, #FF69B4 0%, #8A2BE2 55%, #4B0082 100%)",
        "pink-glow":
          "linear-gradient(135deg, #FF69B4 0%, #FF2E96 45%, #8A2BE2 100%)",
        "nav-active":
          "linear-gradient(90deg, rgba(255,105,180,0.55) 0%, rgba(138,43,226,0.28) 55%, rgba(13,13,13,0.2) 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0, 0, 0, 0.37)",
        gold: "0 0 20px rgba(212, 175, 55, 0.25)",
        rose: "0 0 18px rgba(255, 77, 166, 0.35)",
        luxury: "0 10px 40px rgba(212, 175, 55, 0.15)",
        glow: "0 0 28px rgba(255, 105, 180, 0.35)",
        "glow-soft": "0 0 40px rgba(138, 43, 226, 0.22)",
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
