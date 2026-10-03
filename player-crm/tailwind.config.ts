import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ROGON Akzentgrün (#A0F028 aus den Markenformen auf rogon.tv)
        brand: {
          50: '#f6fde9',
          100: '#ecfbcc',
          200: '#d9f79b',
          300: '#c2f263',
          400: '#a0f028',
          500: '#8ad81a',
          600: '#6aa913',
          700: '#4f7d11',
          800: '#3c5f12',
          900: '#2c4410',
        },
        // ROGON Markenblau (#0A4165 aus dem Stylesheet von rogon.tv)
        navy: {
          50: '#eef4f9',
          100: '#d6e4f0',
          200: '#adc8df',
          300: '#7aa3c6',
          400: '#3f73a0',
          500: '#0a4165',
          600: '#083450',
          700: '#062842',
          800: '#051e32',
          900: '#031523',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        sans: ['var(--font-body)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
