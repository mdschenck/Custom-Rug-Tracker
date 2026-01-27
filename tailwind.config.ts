import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'jl-charcoal': '#393939',
        'jl-offwhite': '#f6f5f4',
        'jl-dark': '#282828',
        'jl-border': '#ddd',
        'jl-muted': '#8a8885',
        'jl-secondary': '#5c5a57',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
