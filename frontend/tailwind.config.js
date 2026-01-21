/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        foreground: '#fafafa',
        card: {
          DEFAULT: '#121214',
          foreground: '#fafafa',
        },
        popover: {
          DEFAULT: '#09090b',
          foreground: '#fafafa',
        },
        primary: {
          DEFAULT: '#00ff00',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: '#27272a',
          foreground: '#fafafa',
        },
        muted: {
          DEFAULT: '#27272a',
          foreground: '#a1a1aa',
        },
        accent: {
          DEFAULT: '#00ff00',
          foreground: '#000000',
        },
        destructive: {
          DEFAULT: '#ff453a',
          foreground: '#fafafa',
        },
        border: '#27272a',
        input: '#27272a',
        ring: '#00ff00',
      },
      fontFamily: {
        heading: ['Unbounded', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}