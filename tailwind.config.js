import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      animation: {
        aurora: 'aurora 14s ease infinite',
        float: 'float 5s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        'spin-slow': 'spin 14s linear infinite',
      },
      boxShadow: {
        glow: '0 0 30px rgba(74, 222, 128, 0.35), 0 20px 60px rgba(22, 101, 52, 0.25)',
        gold: '0 0 26px rgba(251, 191, 36, 0.45), 0 18px 38px rgba(120, 53, 15, 0.25)',
      },
      colors: {
        bamboo: {
          50: '#f4ffe9',
          200: '#b7ef72',
          500: '#5ab82e',
          700: '#26722e',
        },
        ink: '#43210f',
        honey: '#ffd166',
      },
      fontFamily: {
        display: ['Baloo 2', 'Nunito', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
        han: ['PingFang TC', 'Noto Serif TC', 'Songti TC', 'serif'],
      },
      keyframes: {
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-110%)' },
          '100%': { transform: 'translateX(110%)' },
        },
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
