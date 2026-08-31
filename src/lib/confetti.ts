import confetti from 'canvas-confetti';

/**
 * Luxury Gold Confetti burst for LUMEN Atelier
 * Triggers shimmering gold / warm amber / diamond particles from the specified element or coordinates
 */
export const triggerGoldConfetti = (target?: HTMLElement | { clientX: number; clientY: number } | null) => {
  const goldColors = [
    '#C5A059', // Primary luxury gold
    '#DFBA73', // Light gold
    '#F5D78E', // Champagne gold
    '#E6CA65', // Bright yellow gold
    '#D4AF37', // Metallic gold
    '#FFEAA7', // Warm glowing gold
    '#FFFFFF', // Diamond white shimmer
  ];

  let originX = 0.5;
  let originY = 0.6;

  if (target) {
    if ('getBoundingClientRect' in target) {
      const rect = target.getBoundingClientRect();
      originX = (rect.left + rect.width / 2) / window.innerWidth;
      originY = (rect.top + rect.height / 2) / window.innerHeight;
    } else if ('clientX' in target) {
      originX = target.clientX / window.innerWidth;
      originY = target.clientY / window.innerHeight;
    }
  }

  // First intense gold blast
  confetti({
    particleCount: 70,
    spread: 80,
    angle: 90,
    origin: { x: originX, y: originY },
    colors: goldColors,
    startVelocity: 35,
    gravity: 0.95,
    scalar: 1,
    ticks: 200,
    shapes: ['square', 'circle'],
    disableForReducedMotion: true,
    zIndex: 999999,
  });

  // Secondary side sparkles for a refined atelier feel
  setTimeout(() => {
    confetti({
      particleCount: 35,
      angle: 60,
      spread: 60,
      origin: { x: originX, y: originY },
      colors: goldColors,
      startVelocity: 30,
      gravity: 0.85,
      scalar: 0.8,
      ticks: 180,
      shapes: ['circle', 'square'],
      zIndex: 999999,
    });
    confetti({
      particleCount: 35,
      angle: 120,
      spread: 60,
      origin: { x: originX, y: originY },
      colors: goldColors,
      startVelocity: 30,
      gravity: 0.85,
      scalar: 0.8,
      ticks: 180,
      shapes: ['circle', 'square'],
      zIndex: 999999,
    });
  }, 120);

  // Third subtle shimmer
  setTimeout(() => {
    confetti({
      particleCount: 20,
      angle: 90,
      spread: 100,
      origin: { x: originX, y: originY },
      colors: ['#FFEAA7', '#C5A059', '#FFFFFF'],
      startVelocity: 25,
      gravity: 0.7,
      scalar: 0.6,
      ticks: 150,
      zIndex: 999999,
    });
  }, 220);
};
