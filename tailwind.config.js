export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette built around #1A5DA0 (corporate blue)
        brand: {
          50:  '#f0f6fb',
          100: '#dbe9f3',
          200: '#b7d2e7',
          300: '#87b3d5',
          400: '#4f8dbe',
          500: '#2a6da6',
          600: '#1A5DA0',  // exact requested color
          700: '#154d85',
          800: '#133f6b',
          900: '#0f2f50',
        },
        nav: {
          900: '#0a1c30',
          800: '#0f2540',
          700: '#143458',
          600: '#1A5DA0',
          500: '#2e76b7',
          400: '#6398c8',
          300: '#a4c2dd',
          200: '#cddff0',
          100: '#e7f0f8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgba(15,23,42,0.04), 0 1px 1px 0 rgba(15,23,42,0.03)',
        'lift': '0 8px 24px -8px rgba(15,23,42,0.10), 0 2px 6px -2px rgba(15,23,42,0.06)',
        'glow-brand': '0 6px 20px -6px rgba(26,93,160,0.55)',
      },
    },
  },
  plugins: [],
};
