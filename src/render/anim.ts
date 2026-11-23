export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Progreso 0..1 de una animación que empieza en `start` ms y dura `dur` ms. */
export const prog = (t: number, start: number, dur: number) => (dur <= 0 ? (t >= start ? 1 : 0) : clamp01((t - start) / dur));

export const ease = {
  linear: (x: number) => x,
  outCubic: (x: number) => 1 - (1 - x) ** 3,
  outQuart: (x: number) => 1 - (1 - x) ** 4,
  outQuint: (x: number) => 1 - (1 - x) ** 5,
  outExpo: (x: number) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
  inOutCubic: (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
  inOutSine: (x: number) => -(Math.cos(Math.PI * x) - 1) / 2,
  outBack: (x: number) => {
    const c1 = 1.70158, c3 = c1 + 1;
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2;
  },
};

/** Valor intermedio con easing. */
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Pequeño generador pseudoaleatorio determinista (mismas animaciones en pantalla y en vídeo). */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}
