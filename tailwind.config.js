/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'surface-base':     '#0A0E14',
        'surface-elevated': '#141B26',
        'surface-card':     '#1C2533',
        'border-subtle':    '#2D3748',
        'text-primary':     '#F7FAFC',
        'text-secondary':   '#94A3B8',
        electric:           '#00F0FF',
        neon:               '#39FF14',
        alert:              '#FF3131',
        'form-elite':       '#39FF14',
        'form-high':        '#ADFF2F',
        'form-avg':         '#FFD700',
        'form-low':         '#FF4500',
        'form-critical':    '#FF3131',
      },
      fontFamily: {
        sans: ['Hanken Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
