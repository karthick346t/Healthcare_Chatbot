// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PRIMARY (60% - Teal)
        primary: {
          50: 'rgb(var(--primary-50) / <alpha-value>)',
          100: 'rgb(var(--primary-100) / <alpha-value>)',
          200: 'rgb(var(--primary-200) / <alpha-value>)',
          300: 'rgb(var(--primary-300) / <alpha-value>)',
          400: 'rgb(var(--primary-400) / <alpha-value>)',
          500: 'rgb(var(--primary-500) / <alpha-value>)',
          600: 'rgb(var(--primary-600) / <alpha-value>)',
          700: 'rgb(var(--primary-700) / <alpha-value>)',
          800: 'rgb(var(--primary-800) / <alpha-value>)',
          900: 'rgb(var(--primary-900) / <alpha-value>)',
        },
        // SECONDARY (30% - Neutral)
        secondary: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        // ACCENT (10%)
        accent: {
          orange: '#FF6B35',
          red: '#E63946',
          green: '#06D6A0',
          yellow: '#FFD166',
        },
        // NEUMORPHISM BASE
        neu: {
          DEFAULT: '#eef2f5', // Light mode bg
          dark: '#1a1d24',    // Dark mode bg (slate-blue)
        },
        // DYNAMIC ACCENT 
        themeAccent: {
          50: 'rgb(var(--accent-50) / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
          800: 'rgb(var(--accent-800) / <alpha-value>)',
          900: 'rgb(var(--accent-900) / <alpha-value>)',
        }
      },
      boxShadow: {
        'neu-out': '6px 6px 12px #c8d0e7, -6px -6px 12px #ffffff',
        'neu-out-dark': '6px 6px 12px #111318, -6px -6px 12px #232730',
        'neu-in': 'inset 4px 4px 8px #c8d0e7, inset -4px -4px 8px #ffffff',
        'neu-in-dark': 'inset 4px 4px 8px #111318, inset -4px -4px 8px #232730',
        'neu-out-lg': '8px 8px 16px #c8d0e7, -8px -8px 16px #ffffff',
        'neu-out-lg-dark': '8px 8px 16px #111318, -8px -8px 16px #232730',
        'neu-out-xl': '20px 20px 60px #c8d0e7, -20px -20px 60px #ffffff',
        'neu-out-xl-dark': '20px 20px 60px #111318, -20px -20px 60px #232730',
        'neu-in-sm': 'inset 2px 2px 4px #c8d0e7, inset -2px -2px 4px #ffffff',
        'neu-in-sm-dark': 'inset 2px 2px 4px #111318, inset -2px -2px 4px #232730',
        'neu-in-lg': 'inset 6px 6px 12px #c8d0e7, inset -6px -6px 12px #ffffff',
        'neu-in-lg-dark': 'inset 6px 6px 12px #111318, inset -6px -6px 12px #232730',
      },
      animation: {
        marquee: 'marquee 18s linear infinite',
        fadeIn: 'fadeIn 0.3s ease',
        bounce: 'bounce 1s infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};
