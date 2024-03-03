import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        blackish: '#121418',
        whitish: '#F5F5F5',
      },
      borderRadius: {
        default: '0.5rem',
      },
      height: {
        '84': '21rem',
        '128': '32rem',
        '160': '40rem',
        '192': '48rem',
        '224': '56rem',
        '256': '64rem',
      },
      animation: {
        'ready-movement': 'box-shadow-shrink 0.5s forwards, pulse-scale 2s infinite',
        'post-action-movement':
          'pulse 2s infinite, shrink-bounce 20s infinite, box-shadow-transition-total 2s infinite',
        'idle-shadow-movement': 'box-shadow-transition-slight-large 3s linear infinite',
        'idle-shadow-movement-tiny': 'box-shadow-transition-slight-tiny 3s linear infinite',
        'unready-movement': 'box-shadow-grow 1s forwards',
      },
      boxShadow: {
        'light-sm': '0 0 5px 1px #F5F5F5, 0 0 0 0 #F5F5F5',
        'light-md': '0 0 75px 0 #F5F5F5, 0 0 0 0 #F5F5F5',
        'light-lg': '0 0 150px 0 #F5F5F5, 0 0 0 0 #F5F5F5',
      },
      keyframes: {
        'pulse-scale': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        'shrink-bounce': {
          '0%': { transform: 'scale(1)' },
          '5%': { transform: 'scale(0)' },
          '10%': { transform: 'scale(0.3)' },
          '15%': { transform: 'scale(0.1)' },
          '20%': { transform: 'scale(0.3)' },
          '25%': { transform: 'scale(0.1)' },
          '30%': { transform: 'scale(0.3)' },
          '35%': { transform: 'scale(0.1)' },
          '40%': { transform: 'scale(0.3)' },
          '45%': { transform: 'scale(0.1)' },
          '50%': { transform: 'scale(0.3)' },
          '55%': { transform: 'scale(0.1)' },
          '60%': { transform: 'scale(0.3)' },
          '65%': { transform: 'scale(0.1)' },
          '70%': { transform: 'scale(0.3)' },
          '75%': { transform: 'scale(0.1)' },
          '80%': { transform: 'scale(0.3)' },
          '85%': { transform: 'scale(0.5)' },
          '90%': { transform: 'scale(0.7)' },
          '95%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
        'box-shadow-transition-total': {
          '0%': { boxShadow: '0 0 5px 1px #F5F5F5, 0 0 0 0 #F5F5F5' },
          '50%': { boxShadow: '0 0 150px 0 #F5F5F5, 0 0 0 0 #F5F5F5' },
          '100%': { boxShadow: '0 0 5px 1px #F5F5F5, 0 0 0 0 #F5F5F5' },
        },
        'box-shadow-transition-slight-large': {
          '0%': { boxShadow: '0 0 150px 0 #F5F5F5, 0 0 0 0 #F5F5F5' },
          '50%': { boxShadow: '0 0 75px 0 #F5F5F5, 0 0 0 0 #F5F5F5' },
          '100%': { boxShadow: '0 0 150px 0 #F5F5F5, 0 0 0 0 #F5F5F5' },
        },
        'box-shadow-transition-slight-tiny': {
          '0%': { boxShadow: '0 0 5px 1px #F5F5F5, 0 0 0 0 #F5F5F5' },
          '50%': { boxShadow: '0 0 25px 0 #F5F5F5, 0 0 0 0 #F5F5F5' },
          '100%': { boxShadow: '0 0 5px 1px #F5F5F5, 0 0 0 0 #F5F5F5' },
        },
        'box-shadow-grow': {
          '0%': { boxShadow: '0 0 5px 1px #F5F5F5, 0 0 0 0 #F5F5F5' },
          '100%': { boxShadow: '0 0 150px 0 #F5F5F5, 0 0 0 0 #F5F5F5' },
        },
        'box-shadow-shrink': {
          '0%': { boxShadow: '0 0 150px 0 #F5F5F5, 0 0 0 0 #F5F5F5' },
          '100%': { boxShadow: '0 0 5px 1px #F5F5F5, 0 0 0 0 #F5F5F5' },
        },
      },
    },
  },
  variants: {
    extend: {
      boxShadow: ['hover', 'focus'],
    },
  },
  plugins: [],
} satisfies Config
