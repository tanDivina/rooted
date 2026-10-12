/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Rooted palette: bark, moss, parchment
        parchment: { DEFAULT: '#F3EDE0', deep: '#E9E0CC', paper: '#FBF8F1' },
        bark: { DEFAULT: '#3B2A1E', soft: '#6B5242', mute: '#8C7563', line: '#D9CDB6' },
        moss: { DEFAULT: '#5C6B37', deep: '#3E4A23', soft: '#8E9A5E', wash: '#E4E6CF' },
        honey: { DEFAULT: '#B7791F', wash: '#F4E5C4' },
        ember: { DEFAULT: '#A8432B', deep: '#7E2E1C', wash: '#F3DCD2' },
        // Kept for the webhook/processor views that still reference them
        'dash-cyan': '#5C6B37',
        'dash-dark': '#F3EDE0',
        'dash-panel': '#FBF8F1',
        'dash-card': '#E9E0CC',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        leaf: '0 1px 0 rgba(59,42,30,0.04), 0 8px 24px -12px rgba(59,42,30,0.25)',
      },
    },
  },
  plugins: [],
}
