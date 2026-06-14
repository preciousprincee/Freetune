/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Spotify-inspired dark palette
        base:    '#121212',   // main background
        surface: '#181818',   // card background
        elevated:'#282828',   // hover / elevated surface
        subtle:  '#2a2a2a',   // borders / dividers
        muted:   '#b3b3b3',   // secondary text
        fg:      '#ffffff',   // primary text
        green:   '#1db954',   // FreeTune accent (Spotify green — users recognise it)
        'green-hover': '#1ed760',
        red:     '#e85d5d',   // error / delete
      },
      screens: {
        xs: '375px',
      },
      height: {
        'player': '80px',
        'nav':    '64px',
      },
      animation: {
        'fade-in':   'fadeIn 0.25s ease forwards',
        'slide-up':  'slideUp 0.3s ease forwards',
        'spin-once': 'spin 1s linear',
        'pulse-green': 'pulseGreen 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseGreen: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(29,185,84,0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(29,185,84,0)' },
        },
      },
    },
  },
  plugins: [],
}
