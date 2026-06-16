export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        base: '#121212', surface: '#181818', elevated: '#282828',
        subtle: '#333333', muted: '#b3b3b3', fg: '#ffffff',
        green: '#1db954', 'green-d': '#169a45', red: '#e85d5d',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease forwards',
        'slide-up': 'slideUp 0.3s ease forwards',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 },                              to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
