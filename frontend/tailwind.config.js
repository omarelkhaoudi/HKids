const HKIDS_GREEN = {
  50: 'var(--color-primary-50)',
  100: 'var(--color-primary-100)',
  200: 'var(--color-primary-200)',
  300: 'var(--color-primary-300)',
  400: 'var(--color-primary-400)',
  500: 'var(--color-primary-500)',
  600: 'var(--color-primary-600)',
  700: 'var(--color-primary-700)',
  800: 'var(--color-primary-800)',
  900: 'var(--color-primary-900)',
  950: 'var(--color-primary-900)',
};

const HKIDS_BROWN = {
  50: 'var(--color-secondary-50)',
  100: 'var(--color-secondary-100)',
  200: 'var(--color-secondary-200)',
  300: 'var(--color-secondary-300)',
  400: 'var(--color-secondary-400)',
  500: 'var(--color-secondary-500)',
  600: 'var(--color-secondary-600)',
  700: 'var(--color-secondary-700)',
  800: 'var(--color-secondary-800)',
  900: 'var(--color-secondary-900)',
  950: 'var(--color-secondary-900)',
};

const HKIDS_NEUTRAL = {
  50: 'var(--color-surface-50)',
  100: 'var(--color-surface-100)',
  200: 'var(--color-surface-200)',
  300: 'var(--color-surface-300)',
  400: 'var(--color-surface-400)',
  500: 'var(--color-surface-500)',
  600: 'var(--color-surface-600)',
  700: 'var(--color-surface-700)',
  800: 'var(--color-surface-800)',
  900: 'var(--color-surface-900)',
  950: 'var(--color-surface-900)',
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-body)', 'Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        hero: ['var(--text-hero-size)', { lineHeight: 'var(--text-hero-lh)', fontWeight: '900', letterSpacing: '0' }],
        'heading-xl': ['var(--text-heading-xl-size)', { lineHeight: 'var(--text-heading-xl-lh)', fontWeight: '800', letterSpacing: '0' }],
        'heading-l': ['var(--text-heading-l-size)', { lineHeight: 'var(--text-heading-l-lh)', fontWeight: '800', letterSpacing: '0' }],
        'heading-m': ['var(--text-heading-m-size)', { lineHeight: 'var(--text-heading-m-lh)', fontWeight: '700' }],
        'body-lg': ['var(--text-body-lg-size)', { lineHeight: 'var(--text-body-lg-lh)', fontWeight: '600' }],
        body: ['var(--text-body-size)', { lineHeight: 'var(--text-body-lh)', fontWeight: '500' }],
        caption: ['var(--text-caption-size)', { lineHeight: 'var(--text-caption-lh)', fontWeight: '600' }],
      },
      /*
       * Design System spacing tokens (named, non-destructive).
       * These are ADDED alongside Tailwind's native scale so that
       * numeric utilities (p-4, w-8, gap-8, m-8, ...) keep their
       * default Tailwind rem values. DS components opt in explicitly
       * via `*-space-N` utilities (e.g. p-space-16 = 16px).
       */
      spacing: {
        'space-4': 'var(--space-4)',
        'space-8': 'var(--space-8)',
        'space-12': 'var(--space-12)',
        'space-16': 'var(--space-16)',
        'space-20': 'var(--space-20)',
        'space-24': 'var(--space-24)',
        'space-32': 'var(--space-32)',
        'space-40': 'var(--space-40)',
        'space-48': 'var(--space-48)',
        'space-64': 'var(--space-64)',
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
        'full': '9999px',
        '8': 'var(--radius-8)',
        '12': 'var(--radius-12)',
        '16': 'var(--radius-16)',
        '20': 'var(--radius-20)',
        '24': 'var(--radius-24)',
        '32': 'var(--radius-32)',
      },

      textColor: {
        foreground: {
          DEFAULT: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          50: 'var(--color-surface-50)',
          100: 'var(--color-surface-100)',
          200: 'var(--color-surface-200)',
          300: 'var(--color-surface-300)',
          400: 'var(--color-text-muted)',
          500: 'var(--color-primary-600)',
          600: 'var(--color-primary-700)',
          700: 'var(--color-text-primary)',
          800: 'var(--color-text-primary)',
          900: 'var(--color-text-primary)',
          950: 'var(--color-text-primary)',
        }
      },

      colors: {
        'hkids-green': {
          DEFAULT: 'var(--hkids-green)',
          light: 'var(--hkids-green-light)',
          soft: 'var(--hkids-green-soft)',
          dark: 'var(--hkids-green-dark)',
          darker: 'var(--hkids-green-darker)',
        },
        'hkids-brown': {
          DEFAULT: 'var(--hkids-brown)',
          light: 'var(--hkids-brown-light)',
          soft: 'var(--hkids-brown-soft)',
          dark: 'var(--hkids-brown-dark)',
          darker: 'var(--hkids-brown-darker)',
        },
        primary: HKIDS_GREEN,
        secondary: HKIDS_BROWN,
        success: {
          50: 'var(--hkids-green-soft)',
          100: 'var(--hkids-green-light)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--hkids-green)',
          600: 'var(--hkids-green-dark)',
          700: 'var(--hkids-green-darker)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-900)',
        },
        warning: {
          50: 'var(--hkids-brown-soft)',
          100: 'var(--hkids-brown-light)',
          500: 'var(--hkids-brown)',
          600: 'var(--hkids-brown-dark)',
          700: 'var(--hkids-brown-darker)',
          900: 'var(--color-secondary-900)',
          950: 'var(--color-secondary-900)',
        },
        danger: {
          50: 'var(--hkids-brown-soft)',
          100: 'var(--hkids-brown-light)',
          500: 'var(--hkids-brown-dark)',
          600: 'var(--hkids-brown-darker)',
          700: 'var(--color-secondary-800)',
          900: 'var(--color-secondary-900)',
          950: 'var(--color-secondary-900)',
        },
        info: {
          50: 'var(--hkids-green-soft)',
          100: 'var(--hkids-green-light)',
          500: 'var(--hkids-green)',
          600: 'var(--hkids-green-dark)',
          700: 'var(--hkids-green-darker)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-900)',
        },
        background: {
          DEFAULT: 'var(--color-bg)',
          card: 'var(--color-bg-card)',
          elevated: 'var(--color-bg-elevated)',
          kids: 'var(--color-kids-bg)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          secondary: 'var(--color-surface-secondary)',
          ...HKIDS_NEUTRAL,
        },
        foreground: {
          DEFAULT: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          50: 'var(--color-surface-50)',
          100: 'var(--color-surface-100)',
          200: 'var(--color-surface-200)',
          300: 'var(--color-surface-300)',
          400: 'var(--color-text-muted)',
          500: 'var(--color-primary-600)',
          600: 'var(--color-primary-700)',
          700: 'var(--color-text-primary)',
          800: 'var(--color-text-primary)',
          900: 'var(--color-text-primary)',
          950: 'var(--color-text-primary)',
        },
        neutral: HKIDS_NEUTRAL,
        gray: HKIDS_NEUTRAL,
        card: {
          DEFAULT: 'var(--color-card)',
          elevated: 'var(--color-elevated)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
        },
        divider: {
          DEFAULT: 'var(--color-divider)',
        },
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        floating: 'var(--shadow-floating)',
        medium: 'var(--shadow-card)',
        large: 'var(--shadow-floating)',
        glass: 'var(--shadow-soft)',
        glow: '0 0 20px rgba(var(--color-primary-500-rgb), 0.3)',
        'kids-soft': 'var(--shadow-card)',
        'kids-warm': 'var(--shadow-floating)',
      },
      minHeight: {
        'touch': '44px',
        'touch-kids': '56px',
      },
      minWidth: {
        'touch': '44px',
        'touch-kids': '56px',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
