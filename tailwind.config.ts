import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./components/**/*.{js,ts,jsx,tsx,mdx}', './app/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        't-4xl': '3rem',
      },
      fontFamily: {
        tiny: ['var(--font-tiny5)', 'sans-serif'],
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        anton: ['var(--font-anton)', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config
