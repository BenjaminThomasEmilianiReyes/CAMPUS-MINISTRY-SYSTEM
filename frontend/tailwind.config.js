/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#33457C",
        secondary: "#5A6FAF",
        "card-bg": "#E5E7EB",
        "text-dark": "#1F2A44",
        "text-light": "#FFFFFF",
        accent: "#D32F2F",
        "accent-gold": "#F4C430",
        dark: "#1F2A44",
        blue: {
          50: "#EEF2FF",
          100: "#DDE5FF",
          200: "#C7D3F5",
          300: "#AAB9E4",
          400: "#7F91C8",
          500: "#5A6FAF",
          600: "#33457C",
          700: "#2A3868",
          800: "#24315C",
          900: "#1F2A44"
        },
        purple: {
          50: "#EEF2FF",
          100: "#DDE5FF",
          600: "#5A6FAF",
          700: "#33457C",
          800: "#2A3868"
        },
        indigo: {
          50: "#EEF2FF",
          100: "#DDE5FF",
          600: "#5A6FAF",
          700: "#33457C"
        },
        green: {
          50: "#FFF8DB",
          100: "#FEF3C7",
          600: "#5A6FAF",
          700: "#33457C",
          800: "#1F2A44"
        },
        emerald: {
          100: "#FEF3C7",
          600: "#5A6FAF",
          700: "#33457C"
        },
        teal: {
          600: "#5A6FAF",
          700: "#33457C"
        },
        orange: {
          600: "#D32F2F",
          700: "#B32626"
        },
        red: {
          50: "#FDECEC",
          100: "#F9D6D6",
          500: "#D32F2F",
          600: "#D32F2F",
          700: "#B32626",
          800: "#8F1F1F"
        },
        yellow: {
          100: "#FEF3C7",
          300: "#F4C430",
          400: "#F4C430",
          500: "#F4C430",
          600: "#D9A90F",
          800: "#7A5A00",
          900: "#5F4500"
        },
        gray: {
          50: "#F4F5F7",
          100: "#ECEEF2",
          200: "#D9DDE5",
          300: "#C2C9D6",
          400: "#8994AA",
          500: "#66708A",
          600: "#4F5A73",
          700: "#37415C",
          800: "#28334D",
          900: "#1F2A44"
        }
      }
    }
  },
  plugins: [],
}
