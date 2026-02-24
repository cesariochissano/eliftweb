import defaultTheme from 'tailwindcss/defaultTheme';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '375px', // iPhone SE/Mini
      ...defaultTheme.screens,
      'pro': '428px', // iPhone Max / Ultra
    },
    extend: {
      colors: {
        primary: "#3ae012",
        "primary-dark": "#2db50e",
        "text-main": "#101b0d",
        "text-muted": "#6b7280",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
      fontSize: {
        // Fluid Typography (Clamp) - 100% Fluid, without breakpoints
        'fluid-h1': 'clamp(1.5rem, 5vw + 1rem, 2.75rem)',
        'fluid-h2': 'clamp(1.25rem, 4vw + 0.5rem, 2rem)',
        'fluid-h3': 'clamp(1.1rem, 3vw + 0.25rem, 1.75rem)',
        'fluid-body': 'clamp(0.875rem, 2vw + 0.1rem, 1.0625rem)',
        'fluid-sm': 'clamp(0.75rem, 1.5vw + 0.1rem, 0.9375rem)',
      },
      spacing: {
        // Semantic Spacing Tokens
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'nav-h': '64px',
        // 'service-grid': handled via utility classes or specific gaps if needed, 
        // but 'gap-service-grid' will be a custom class in index.css or simple gap utility.
        // We will define specific tokens if needed, but for now standar spacing is fine.
      }
    },
  },
  plugins: [
    typography,
  ],
}
