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
  // Every cut flies into a real object that the next still also has (the Lotus Tower, the lit window,
  // the server glow, the sun, the phone...), and the next still opens from inside that same object.
  { out: [0.5, 0.42], in: [0.18, 0.62] }, //                K00 Lotus Tower         -> K01 the same tower, now in the distance
  { out: [0.505, 0.5], in: [0.86, 0.2] }, //                K01 the lit window      -> K02 him, inside that window
  { out: [0.29, 0.47], in: [0.34, 0.4] }, //                K02 Lotus Tower outside -> K03 the same tower over his shoulder
  { out: [0.66, 0.62], in: [0.5, 0.47], flash: 0.3 }, //    K03 green graphs        -> K04 the green-lit aisle and its glow
  { out: [0.5, 0.47], in: [0.5, 0.49], flash: 0.55 }, //    K04 glow at the aisle end -> K05 the sun
  { out: [0.5, 0.49], in: [0.53, 0.7], dip: 0.94 }, //      K05 the sun sets to black -> K06 the 3 AM phone
  { out: [0.53, 0.7], in: [0.45, 0.83] }, //                K06 the phone           -> K07 the same phone, quiet at dawn
  { out: [0.1, 0.35], in: [0.45, 0.25] }, //                K07 morning window      -> K08 the lab windows
  { out: [0.48, 0.22], in: [0.3, 0.2] }, //                 K08 the trees outside   -> K09 the campus trees
  { out: [0.55, 0.1], in: [0.3, 0.12] }, //                 K09 the morning sky     -> K10 the sunset sky
];

/** Real video for a transition (start frame = still i, end frame = still i+1). Add the number as clips arrive. */
const CLIPS = new Set<number>([0, 1, 2, 3, 4]);
const clipUrl = (i: number) => `/media/web/clips/${String(i + 1).padStart(2, "0")}.mp4`;

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
  uniform sampler2D tA, dA, tB, dB, tV;
  uniform float useV;
  uniform vec2 aspect;       // x: screen aspect, y: image aspect
  uniform vec2 focusAB;      // horizontal focus for A and B
  uniform vec2 anchorA, anchorB;
  uniform float scaleA, scaleB, zoomA, zoomB, mixB, blurA, blurB, dip, flash, time;
  uniform vec2 sway;         // camera offset (mouse + drift)

  vec2 cover(vec2 uv, float focus) {
    // fill the screen with the photo (like background-size: cover), keeping the subject in frame on tall screens
    float s = aspect.x / aspect.y;   // screen aspect / image aspect
    vec2 r = uv;
    if (s > 1.0) r.y = (uv.y - 0.5) / s + 0.5;
    else r.x = (uv.x - 0.5) * s + clamp(focus, 0.5 * s, 1.0 - 0.5 * s);
    return r;
  }

  vec3 shot(sampler2D t, sampler2D d, vec2 base, vec2 anchor, float scale, float zoom, float blur) {
    // image coords have y down; textures have y up
    vec2 a = vec2(anchor.x, 1.0 - anchor.y);
    float depth = texture2D(d, base).r;                       // 1 = near
    // slow dolly: near things grow a little faster (depth); the deep fly-in is even so nothing warps
    float s = (1.0 + (scale - 1.0) * (0.55 + 0.9 * depth)) * zoom;
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
    if (useV > 0.5) {
      vec3 v0 = texture2D(tV, cover(vUv, 0.5)).rgb;
      vec2 vv = vUv - 0.5;
      v0 *= 1.0 - 0.28 * dot(vv, vv) * 2.0;
      v0 += (grain(vUv) - 0.5) * 0.035;
      gl_FragColor = vec4(v0, 1.0);
      return;
    }
    vec3 a = shot(tA, dA, cover(vUv, focusAB.x), anchorA, scaleA, zoomA, blurA);
    vec3 col = a;
    if (mixB > 0.0) {
      vec3 b = shot(tB, dB, cover(vUv, focusAB.y), anchorB, scaleB, zoomB, blurB);
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
          zoomA: { value: 1 },
          zoomB: { value: 1 },
          mixB: { value: 0 },
          blurA: { value: 0 },
          blurB: { value: 0 },
          dip: { value: 0 },
          flash: { value: 0 },
          time: { value: 0 },
          sway: { value: new THREE.Vector2() },
          tV: { value: null as THREE.Texture | null },
          useV: { value: 0 },
        },
      }),
    [tex, dep],
  );

  // One <video> per clip, scrubbed by scroll. All-intra encodes make seeking instant.
  const vids = useMemo(() => {
    const m = new Map<number, { el: HTMLVideoElement; tex: THREE.VideoTexture; ok: boolean }>();
    CLIPS.forEach((i) => {
      const el = document.createElement("video");
      el.src = clipUrl(i);
      el.muted = true;
      el.playsInline = true;
      el.preload = "auto";
      el.crossOrigin = "anonymous";
      const t = new THREE.VideoTexture(el);
      t.colorSpace = THREE.NoColorSpace;
      t.minFilter = THREE.LinearFilter;
      t.generateMipmaps = false;
      const v = { el, tex: t, ok: false };
      // Once a clip has decoded a frame it stays "ready": a seek briefly drops readyState, and falling
      // back to the photo for that frame is what made the picture flicker.
      el.addEventListener("loadeddata", () => (v.ok = true), { once: true });
      m.set(i, v);
    });
    return m;
  }, []);

  const shown = useRef(2);
  // The opening flight (clips 1 and 2) plays as normal video, not scrubbed.
  const intro = useRef<{ phase: "wait" | number | "done"; since: number }>({ phase: "wait", since: 0 });
  const sway = useRef(new THREE.Vector2());

  const seek = (v: { el: HTMLVideoElement }, time: number) => {
    const el = v.el;
    if (!el.paused) el.pause();
    if (el.seeking) return; // let the current seek land first; queuing seeks causes judder
    if (Math.abs(el.currentTime - time) > 1 / 60) el.currentTime = time;
  };

  const showVideo = (v: { tex: THREE.VideoTexture }) => {
    const u = mat.uniforms;
    u.tV.value = v.tex;
    u.useV.value = 1;
    u.mixB.value = 0;
    u.dip.value = 0;
    u.flash.value = 0;
  };

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const u = mat.uniforms;
    u.time.value = state.clock.elapsedTime;
    u.aspect.value.set(size.width / size.height, tex[0].image ? tex[0].image.width / tex[0].image.height : 16 / 9);

    // ---------------- opening flight: Colombo -> the tower -> through the window -> him
    const it = intro.current;
    if (it.phase !== "done") {
      const c0 = vids.get(0);
      const c1 = vids.get(1);
      const scrolled = journey.t >= 0.02 || journey.calm;
      if (scrolled || !c0 || !c1) {
        it.phase = "done";
        c0?.el.pause();
        c1?.el.pause();
      } else if (it.phase === "wait") {
        if (c0.ok) {
          it.phase = 0;
          c0.el.currentTime = 0;
          void c0.el.play().catch(() => (it.phase = "done"));
        } else if (state.clock.elapsedTime > 4) it.phase = "done"; // slow network: skip the intro
        else {
          u.useV.value = 0;
          u.tA.value = tex[0];
          u.dA.value = dep[0];
          u.scaleA.value = 1;
          u.zoomA.value = 1;
          u.mixB.value = 0;
        }
      } else {
        const cur = it.phase === 0 ? c0 : c1;
        showVideo(cur);
        if (cur.el.ended || cur.el.currentTime >= cur.el.duration - 0.06) {
          if (it.phase === 0 && c1.ok) {
            it.phase = 1;
            c1.el.currentTime = 0;
            void c1.el.play().catch(() => (it.phase = "done"));
          } else it.phase = "done";
        }
      }
      if (it.phase !== "done") return;
      shown.current = 2;
    }

    // ---------------- scroll
    const target = stillAt(journey.t);
    const k = journey.calm ? 1 : 1 - Math.exp(-d * 4);
    shown.current += (target - shown.current) * k;
    const s = shown.current;

    const i = Math.min(Math.floor(s), N - 1);
    const f = s - i;
    const cut = CUTS[i];
    const dwell = Math.min(f / 0.5, 1);
    const p = i < N - 1 ? THREE.MathUtils.clamp((f - 0.5) / 0.5, 0, 1) : 0;

    const out = vids.get(i); // video leaving this still
    const inc = vids.get(i - 1); // video that arrived at this still
    if (p > 0 && out?.ok) {
      seek(out, p * (out.el.duration - 0.05));
      showVideo(out);
    } else if (p === 0 && inc?.ok) {
      // Hold on the last frame of the clip that brought us here, so there is no jump to the photo.
      seek(inc, inc.el.duration - 0.05);
      showVideo(inc);
    } else if (p === 0 && out?.ok) {
      seek(out, 0);
      showVideo(out);
    } else {
      // ---------------- photo fallback (stills that have no clip yet)
      u.useV.value = 0;
      u.tA.value = tex[i];
      u.dA.value = dep[i];
      u.focusAB.value.x = FOCUS_X[i];
      u.anchorA.value.set(...(cut ? cut.out : [0.5, 0.5]));
      const pa = THREE.MathUtils.clamp(p / 0.56, 0, 1);
      u.scaleA.value = 1 + 0.07 * dwell;
      u.zoomA.value = 1 + (cut ? easeIn(pa) * 14 : 0);
      u.blurA.value = cut ? 0.12 * smooth(0.25, 1, pa) : 0;
      if (cut && p > 0) {
        u.tB.value = tex[i + 1];
        u.dB.value = dep[i + 1];
        u.focusAB.value.y = FOCUS_X[i + 1];
        u.anchorB.value.set(...cut.in);
        const q = THREE.MathUtils.clamp((p - 0.5) / 0.5, 0, 1);
        u.scaleB.value = 1;
        u.zoomB.value = 1 + (1 - easeOut(q)) * 10;
        u.blurB.value = 0.12 * (1 - smooth(0, 0.7, q));
        u.mixB.value = smooth(0.5, 0.6, p);
        u.dip.value = (cut.dip ?? 0) * bell(p);
        u.flash.value = (cut.flash ?? 0) * bell((p - 0.3) / 0.5);
      } else {
        u.mixB.value = 0;
        u.dip.value = 0;
        u.flash.value = 0;
      }
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
