export type CubicBezier = [number, number, number, number];

export const spatialEase = {
  spatial: [0.16, 1, 0.3, 1] as CubicBezier,
  power2InOut: [0.455, 0.03, 0.515, 0.955] as CubicBezier,
  power3Out: [0.215, 0.61, 0.355, 1] as CubicBezier,
  expoOut: [0.19, 1, 0.22, 1] as CubicBezier,
};

export const spatialDuration = {
  exit: 0.5,
  enter: 0.8,
};

export const moduleCardMotion = {
  initial: { opacity: 0, y: 30, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: spatialDuration.enter, delay: 0.1, ease: spatialEase.expoOut },
  },
  exit: {
    opacity: 0,
    y: -15,
    scale: 0.98,
    transition: { duration: spatialDuration.exit, ease: spatialEase.power2InOut },
  },
};

export const intentNodeMotion = {
  idle: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: spatialDuration.enter, ease: spatialEase.power3Out },
  },
  receded: {
    y: -200,
    opacity: 0.3,
    scale: 0.95,
    transition: { duration: spatialDuration.enter, ease: spatialEase.power3Out },
  },
};

export const ambientCardMotion = {
  initial: { opacity: 0, x: 40 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: spatialDuration.enter, ease: spatialEase.power3Out },
  },
  exit: {
    opacity: 0,
    x: 40,
    transition: { duration: spatialDuration.exit, ease: spatialEase.power2InOut },
  },
};
