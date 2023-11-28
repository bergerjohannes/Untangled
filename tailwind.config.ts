import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blackish: '#121418',
        whitish: '#F5F5F5',
      },
    },
  },
  plugins: [],
} satisfies Config
