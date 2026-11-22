import { useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { journey, LAST } from "./store";

/* ------------------------------------------------------------------ the photographs

   One continuous camera move through eleven stills: each still holds while its chapter is read,
   then the camera dollies into a point of it (the lit window, the laptop screen, the end of the aisle...)
   and lands in the next still. Depth maps make near things move more than far things, so the photos
   behave like footage rather than flat zooms. */

const N = 11;
const name = (i: number) => `K${String(i).padStart(2, "0")}`;

type Cut = { out: [number, number]; in: [number, number]; dip?: number; flash?: number };
// Anchors in image coordinates (x right, y down, 0..1).
const CUTS: Cut[] = [
  { out: [0.66, 0.46], in: [0.505, 0.5] }, //  K00 city        -> K01 tower
  { out: [0.505, 0.5], in: [0.62, 0.55] }, //  K01 lit window  -> K02 office
  { out: [0.9, 0.63], in: [0.7, 0.6] }, //     K02 laptop      -> K03 screen
  { out: [0.7, 0.59], in: [0.5, 0.49], flash: 0.25 }, //  K03 screen -> K04 data centre
  { out: [0.5, 0.48], in: [0.5, 0.5], flash: 0.6 }, //    K04 aisle end -> K05 sunrise
  { out: [0.5, 0.82], in: [0.54, 0.7], dip: 0.9 }, //     K05 clouds below -> K06 3 AM phone
  { out: [0.54, 0.7], in: [0.45, 0.83] }, //   K06 phone       -> K07 phone on the desk at dawn
  { out: [0.48, 0.47], in: [0.36, 0.67] }, //  K07 monitor     -> K08 lab robot
  { out: [0.55, 0.2], in: [0.35, 0.25], flash: 0.2 }, //  K08 trees -> K09 campus
  { out: [0.75, 0.1], in: [0.25, 0.2] }, //    K09 sky         -> K10 rooftop
];

// Where the subject sits horizontally, used to crop sensibly on tall (phone) screens.
const FOCUS_X = [0.5, 0.6, 0.74, 0.68, 0.5, 0.5, 0.52, 0.72, 0.42, 0.76, 0.74];

// The still each chapter holds on: cover, glance, WSO2, PageRewind, open source, projects, experience, toolbox, contact.
const HOLD = [2, 3, 5, 6, 7, 8, 9, 10, 10.6];

/** Chapter position (journey.t, 0..LAST) -> position along the stills (0..10.x). */
function stillAt(t: number) {
  const c = THREE.MathUtils.clamp(t, 0, LAST);
  const i = Math.min(Math.floor(c), HOLD.length - 2);
  return THREE.MathUtils.lerp(HOLD[i], HOLD[i + 1], c - i);
}

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D tA, dA, tB, dB;
  uniform vec2 aspect;       // x: screen aspect, y: image aspect
  uniform vec2 focusAB;      // horizontal focus for A and B
  uniform vec2 anchorA, anchorB;
  uniform float scaleA, scaleB, mixB, blurA, blurB, dip, flash, time;
  uniform vec2 sway;         // camera offset (mouse + drift)

  vec2 cover(vec2 uv, float focus) {
    // fill the screen with the photo (like background-size: cover), keeping the subject in frame on tall screens
    float s = aspect.x / aspect.y;   // screen aspect / image aspect
    vec2 r = uv;
    if (s > 1.0) r.y = (uv.y - 0.5) / s + 0.5;
    else r.x = (uv.x - 0.5) * s + clamp(focus, 0.5 * s, 1.0 - 0.5 * s);
    return r;
  }

  vec3 shot(sampler2D t, sampler2D d, vec2 base, vec2 anchor, float scale, float blur) {
    // image coords have y down; textures have y up
    vec2 a = vec2(anchor.x, 1.0 - anchor.y);
    float depth = texture2D(d, base).r;                       // 1 = near
    float s = 1.0 + (scale - 1.0) * (0.55 + 0.9 * depth);      // near things rush past faster
    vec2 p = a + (base - a) / s + sway * (depth - 0.35);
    vec3 c = vec3(0.0);
    for (int k = 0; k < 6; k++) {                             // zoom blur toward the anchor while moving fast
      float f = float(k) / 5.0;
      vec2 q = mix(p, a, f * blur);
      c += texture2D(t, clamp(q, 0.001, 0.999)).rgb;
    }
    return c / 6.0;
  }

  float grain(vec2 uv) { return fract(sin(dot(uv * 1000.0 + time, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    vec3 a = shot(tA, dA, cover(vUv, focusAB.x), anchorA, scaleA, blurA);
    vec3 col = a;
    if (mixB > 0.0) {
      vec3 b = shot(tB, dB, cover(vUv, focusAB.y), anchorB, scaleB, blurB);
      col = mix(a, b, mixB);
    }
    col *= 1.0 - dip;
    col = mix(col, vec3(1.0, 0.97, 0.92), flash);
    vec2 v = vUv - 0.5;
    col *= 1.0 - 0.28 * dot(v, v) * 2.0;                       // soft vignette
    col += (grain(vUv) - 0.5) * 0.035;                         // film grain
    gl_FragColor = vec4(col, 1.0);
  }
`;

const easeIn = (x: number) => x * x * x;
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const bell = (x: number) => Math.sin(Math.PI * THREE.MathUtils.clamp(x, 0, 1));
const smooth = (a: number, b: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

function Photos() {
  const { size } = useThree();
  const urls = useMemo(() => Array.from({ length: N }, (_, i) => `/media/web/${name(i)}.jpg`), []);
  const durls = useMemo(() => Array.from({ length: N }, (_, i) => `/media/web/${name(i)}-d.png`), []);
  const tex = useLoader(THREE.TextureLoader, urls);
  const dep = useLoader(THREE.TextureLoader, durls);

  useMemo(() => {
    tex.forEach((t) => {
      t.colorSpace = THREE.NoColorSpace; // flat + linear canvas: pass the photo colours straight through
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
    });
    dep.forEach((t) => {
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
    });
  }, [tex, dep]);

  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          tA: { value: tex[0] },
          dA: { value: dep[0] },
          tB: { value: tex[1] },
          dB: { value: dep[1] },
          aspect: { value: new THREE.Vector2(1, 1) },
          focusAB: { value: new THREE.Vector2(0.5, 0.5) },
          anchorA: { value: new THREE.Vector2(0.5, 0.5) },
          anchorB: { value: new THREE.Vector2(0.5, 0.5) },
          scaleA: { value: 1 },
          scaleB: { value: 1 },
          mixB: { value: 0 },
          blurA: { value: 0 },
          blurB: { value: 0 },
          dip: { value: 0 },
          flash: { value: 0 },
          time: { value: 0 },
          sway: { value: new THREE.Vector2() },
        },
      }),
    [tex, dep],
  );

  const shown = useRef(0);
  const intro = useRef(0); // the opening flight over Colombo into the office, played once on load
  const sway = useRef(new THREE.Vector2());

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const u = mat.uniforms;
    u.time.value = state.clock.elapsedTime;
    u.aspect.value.set(size.width / size.height, tex[0].image ? tex[0].image.width / tex[0].image.height : 16 / 9);

    // Opening flight K00 -> K02 (about 5 s), unless the visitor starts scrolling first.
    if (intro.current < 1 && journey.t < 0.02 && !journey.calm) intro.current = Math.min(1, intro.current + d / 5.2);
    else intro.current = 1;
    const target = intro.current < 1 ? 2 * smooth(0, 1, intro.current) : stillAt(journey.t);
    const k = journey.calm ? 1 : 1 - Math.exp(-d * 4);
    shown.current += (target - shown.current) * k;
    const s = shown.current;

    const i = Math.min(Math.floor(s), N - 1);
    const f = s - i;
    const cut = CUTS[i];
    // First half of each still: a slow dolly while its chapter is read. Second half: fly into the next still.
    const dwell = Math.min(f / 0.5, 1);
    const p = i < N - 1 ? THREE.MathUtils.clamp((f - 0.5) / 0.5, 0, 1) : 0;

    u.tA.value = tex[i];
    u.dA.value = dep[i];
    u.focusAB.value.x = FOCUS_X[i];
    u.anchorA.value.set(...(cut ? cut.out : [0.5, 0.5]));
    u.scaleA.value = 1 + 0.07 * dwell + (cut ? easeIn(p) * 5 : 0);
    u.blurA.value = cut ? 0.1 * smooth(0.2, 0.9, p) : 0;

    if (cut && p > 0) {
      u.tB.value = tex[i + 1];
      u.dB.value = dep[i + 1];
      u.focusAB.value.y = FOCUS_X[i + 1];
      u.anchorB.value.set(...cut.in);
      u.scaleB.value = 1 + (1 - easeOut(p)) * 2.4;
      u.blurB.value = 0.14 * (1 - smooth(0.4, 1, p));
      u.mixB.value = smooth(0.45, 0.8, p);
      u.dip.value = (cut.dip ?? 0) * bell(p);
      u.flash.value = (cut.flash ?? 0) * bell((p - 0.3) / 0.5);
    } else {
      u.mixB.value = 0;
      u.dip.value = 0;
      u.flash.value = 0;
    }

    // Hand-held feel: a little drift plus the pointer.
    const el = state.clock.elapsedTime;
    sway.current.lerp(
      new THREE.Vector2(journey.mouse.x * 0.012 + Math.sin(el * 0.3) * 0.004, journey.mouse.y * 0.008 + Math.cos(el * 0.23) * 0.003),
      1 - Math.exp(-d * 2),
    );
    u.sway.value.copy(sway.current);
  });

  return (
    <mesh frustumCulled={false} material={mat}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

export function PhotoCanvas() {
  return (
    <Canvas dpr={[1, 1.5]} gl={{ antialias: false, powerPreference: "high-performance" }} flat linear>
      <Photos />
    </Canvas>
  );
}
