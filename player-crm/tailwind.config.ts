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
        brand: {
          50: '#f2f8e9',
          100: '#e0f0c8',
          200: '#c3e196',
          300: '#a3d162',
          400: '#8dc63f',
          500: '#79b32c',
          600: '#5e8c22',
          700: '#496c1c',
        },
        navy: {
          50: '#eef1f5',
          100: '#d6dde6',
          200: '#a8b6c8',
          300: '#6d7f97',
          400: '#3c4c63',
          500: '#212f42',
          600: '#141f30',
          700: '#0d1622',
          800: '#0a111b',
          900: '#070c13',
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
