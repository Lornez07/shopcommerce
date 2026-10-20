import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAF8',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#E85D2F',
          hover: '#D04A1F'
        },
        secondary: {
          DEFAULT: '#6B5BFF'
        },
        text: {
          primary: '#1A1A2E',
          muted: '#6B6B7A'
        },
        border: '#E5E3DF',
        success: '#1E8A49',
        error: '#C0392B',
        warning: '#F39C12'
      },
      fontFamily: {
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        body: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace']
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px'
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
        full: '9999px'
      },
      boxShadow: {
        sm: '0 1px 2px rgba(26,26,46,0.06)',
        md: '0 4px 12px rgba(26,26,46,0.08)',
        lg: '0 12px 28px rgba(26,26,46,0.12)'
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms'
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }
    }
  },
  plugins: []
};
export default config;