import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Hausschrift der Marke; schmal laufend, deshalb nur für Überschriften,
        // Navigation und Kennzahlen — nicht für Fließtext und Tabellen.
        marke: ['var(--font-marke)', 'Antonio', 'Impact', 'sans-serif'],
      },
      colors: {
        /**
         * ROGON-Hausfarben. Grundlage ist --color-primary: #0A4165 von rogon.tv.
         * Die Abstufungen folgen demselben Blauton, damit eine Fläche nie aus der
         * Marke fällt; die Zahlen entsprechen in ihrer Helligkeit den Graustufen,
         * die vorher verwendet wurden.
         */
        rogon: {
          50: '#F2F7FA',
          100: '#E2EDF4',
          200: '#C2D9E8',
          300: '#99BED6',
          400: '#6E9DBE',
          500: '#4C7FA3',
          600: '#2F6386',
          700: '#0A4165',
          800: '#0B3350',
          900: '#07243A',
          950: '#041825',
        },
        /** Interaktive Elemente: aufgehellt, damit sie auf dunklem Blau tragen. */
        marke: {
          DEFAULT: '#0A4165',
          hell: '#1A6FA8',
          heller: '#3E9BD6',
        },
        oura: {
          50: '#fdf4ff',
          100: '#fae8ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
        },
        garmin: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}

export default config
