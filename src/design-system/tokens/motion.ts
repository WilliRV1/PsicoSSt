// Precise micro-interactions defined by user rules
export const motion = {
  duration: {
    hover: '120ms',
    dropdown: '160ms',
    toast: '180ms',
    dialog: '220ms',
    pageTransition: '250ms',
  },
  easing: {
    // Linear, no-bounce aesthetic
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    linear: 'linear',
  }
};
