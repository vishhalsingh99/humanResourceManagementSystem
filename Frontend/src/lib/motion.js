// Shared Framer Motion variants. Keep every duration in the 150ms-300ms band
// and prefer opacity/transform (GPU-cheap) so micro-interactions stay snappy.

export const EASE = [0.16, 1, 0.3, 1];

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: EASE },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
};

export const dropdownVariants = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.98 },
  transition: { duration: 0.15, ease: EASE },
};

// Stagger a list's children: spread on the parent, spread `staggerItem` on each child.
export const staggerContainer = {
  initial: 'hidden',
  animate: 'visible',
  variants: {
    hidden: {},
    visible: { transition: { staggerChildren: 0.03 } },
  },
};

export const staggerItem = {
  variants: {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: EASE } },
  },
};
