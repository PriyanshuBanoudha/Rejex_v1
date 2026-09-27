/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#030304',
        matter: '#0F1115',
        bitcoin: '#F7931A',
        burnt: '#EA580C',
        gold: '#FFD600',
        stardust: '#94A3B8',
        boundary: '#1E293B',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'bitcoin-sm': '0 0 20px -5px rgba(234,88,12,0.5)',
        'bitcoin': '0 0 30px -5px rgba(247,147,26,0.6)',
        'bitcoin-card': '0 0 50px -10px rgba(247,147,26,0.1)',
        'gold': '0 0 20px rgba(255,214,0,0.3)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 8s ease-in-out infinite',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
