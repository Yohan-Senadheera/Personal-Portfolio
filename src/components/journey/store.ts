// Shared, mutable state read every frame by the 3D scene.
// Kept outside React so scrolling never triggers re-renders.
export const journey = {
  /** Continuous chapter position: 0 = cover, 1 = glance, ... */
  t: 0,
  /** Pointer in -1..1 (x right, y up). */
  mouse: { x: 0, y: 0 },
  /** True when the viewer prefers reduced motion. */
  calm: false,
};

export const CHAPTERS = [
  { id: "cover", label: "Home" },
  { id: "glance", label: "At a glance" },
  { id: "platform", label: "WSO2 platform" },
  { id: "pagerewind", label: "PageRewind" },
  { id: "opensource", label: "Open source" },
  { id: "path", label: "Experience" },
  { id: "contact", label: "Contact" },
] as const;

/** 1 when the journey is at chapter i, fading to 0 one chapter away. */
export function near(i: number, width = 0.75) {
  const d = Math.abs(journey.t - i);
  return d >= width ? 0 : 1 - d / width;
}

/** The tunnel, night city and galaxy are dark: the UI switches to light text there. */
export function isDark(t: number) {
  return (t > 1.25 && t < 1.82) || (t > 2.45 && t < 4.5);
}
