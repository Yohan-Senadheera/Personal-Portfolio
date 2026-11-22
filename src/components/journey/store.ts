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
  { id: "toolbox", label: "Toolbox" },
  { id: "contact", label: "Contact" },
] as const;

export const LAST = CHAPTERS.length - 1;

/** 1 when the journey is at chapter i, fading to 0 `width` chapters away. */
export function near(i: number, width = 0.75) {
  const d = Math.abs(journey.t - i);
  return d >= width ? 0 : 1 - d / width;
}

/** The tunnel, night city and galaxy are dark: the UI switches to light text there. */
export function isDark(t: number) {
  return (t > 1.25 && t < 1.8) || (t > 2.55 && t < 4.55);
}

/** Cinematic cuts: a soft white or black flash hides each change of world. */
export function flashAt(t: number): { color: string; o: number } {
  const cuts: [number, number, string][] = [
    [1.77, 0.07, "#ffffff"],
    [2.56, 0.09, "#eef3fb"],
    [3.6, 0.08, "#000000"],
    [4.55, 0.08, "#fff4ea"],
  ];
  let best = { color: "#ffffff", o: 0 };
  for (const [c, w, color] of cuts) {
    const o = Math.max(0, 1 - Math.abs(t - c) / w);
    if (o > best.o) best = { color, o };
  }
  return best;
}
