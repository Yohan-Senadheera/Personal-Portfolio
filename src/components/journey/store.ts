// Shared, mutable state read every frame by the 3D scene.
// Kept outside React so scrolling never triggers re-renders.
export const journey = {
  /** Continuous chapter position: 0 = cover, 1 = glance, ... */
  t: 0,
  /** Pointer in -1..1 (x right, y up). */
  mouse: { x: 0, y: 0 },
  /** True when the viewer prefers reduced motion (or ?calm is set). */
  calm: false,
};

export const CHAPTERS = [
  { id: "cover", label: "Home" },
  { id: "glance", label: "At a glance" },
  { id: "platform", label: "WSO2 platform" },
  { id: "pagerewind", label: "PageRewind" },
  { id: "opensource", label: "Open source" },
  { id: "projects", label: "Projects" },
  { id: "path", label: "Experience" },
  { id: "offcall", label: "Off call" },
  { id: "toolbox", label: "Toolbox" },
  { id: "contact", label: "Contact" },
] as const;

export const LAST = CHAPTERS.length - 1;

/** 1 when the journey is at chapter i, fading to 0 `width` chapters away. */
export function near(i: number, width = 0.75) {
  const d = Math.abs(journey.t - i);
  return d >= width ? 0 : 1 - d / width;
}

/** Night stills (city, office, data centre, 3 AM bedroom): the UI switches to light text there. */
export function isDark(t: number) {
  return t < 1.6 || (t > 2.55 && t < 3.45);
}

/** The photo journey makes its own cuts; no page-level flash is needed. */
export function flashAt(_t: number): { color: string; o: number } {
  return { color: "#ffffff", o: 0 };
}
