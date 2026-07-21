export const animation = {
  // Only minimal, elegant animations (Linear style)
  keyframes: {
    'fade-in': {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    'fade-out': {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    'scale-in': {
      '0%': { transform: 'scale(0.98)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
    'slide-in-up': {
      '0%': { transform: 'translateY(8px)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    'slide-in-right': {
      '0%': { transform: 'translateX(8px)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
  },
  timings: {
    'fade-in': 'fade-in 250ms ease-out',
    'fade-out': 'fade-out 200ms ease-in',
    'scale-in': 'scale-in 250ms ease-out',
    'slide-in-up': 'slide-in-up 250ms ease-out',
    'slide-in-right': 'slide-in-right 250ms ease-out',
  }
};
