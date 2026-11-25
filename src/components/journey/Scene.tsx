import { Suspense, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { AdaptiveDpr, Cloud, Clouds, ContactShadows, Html, MeshReflectorMaterial, PerformanceMonitor, RoundedBox, Stars } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, Noise, Vignette } from "@react-three/postprocessing";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import * as THREE from "three";
import { Avatar } from "./Avatar";
import { journey, LAST } from "./store";
import { profile } from "@/content/profile";
import { contributions, statusLabel } from "@/content/ops";

/* =================================================================== the world map
   0 studio (you) -> 1 server rack -> fibre tunnel -> 2 above the clouds (WSO2 platform)
   -> dive -> 3 night city (PageRewind) -> climb -> 4 open-source galaxy
   -> 5 sunrise road: projects -> 6 experience -> 7 studio approach: toolbox -> 8 home
====================================================================================== */

const RACK = new THREE.Vector3(2.6, 0, -4.6);
const TUNNEL = { x: 2.6, y: 1.15, z0: -5.2, z1: -46 };
const SKY = new THREE.Vector3(4.5, 5, -72);
const CITY = new THREE.Vector3(0, -60, -96);
const SPACE = new THREE.Vector3(0, 120, -110);
const ROAD = { x: -16, z0: -72, z1: -8 };

const BLUE = "#3d6bff";
const CYAN = "#46d8ff";
const GREEN = "#22c55e";
const RED = "#ff3b3b";
const AZURE = "#2f8cff";
const AWS = "#ff9a1f";

type V = [number, number, number];

/* ------------------------------------------------------------------ camera path (a smooth spline) */

const CAM: { t: number; pos: V; tgt: V }[] = [
  { t: 0, pos: [-1.35, 1.32, 5.5], tgt: [-1.35, 1.0, 0] },
  { t: 1, pos: [1.05, 1.35, -0.3], tgt: [1.35, 1.45, -4.6] },
  { t: 1.3, pos: [2.6, 1.17, -3.6], tgt: [2.6, 1.15, -12] },
  { t: 1.5, pos: [2.6, 1.15, -16], tgt: [2.6, 1.2, -32] },
  { t: 1.75, pos: [2.0, 2.2, -42], tgt: [1.5, 4, -62] },
  { t: 2, pos: [-13, 12.5, -47], tgt: [0.5, 3.2, -73] },
  { t: 2.45, pos: [1, 1.5, -80], tgt: [2, -40, -88] },
  { t: 2.7, pos: [8, -18, -74], tgt: [2, -48, -96] },
  { t: 3, pos: [24, -20, -64], tgt: [5, -44, -96] },
  { t: 3.5, pos: [4, -20, -92], tgt: [0, 60, -104] },
  { t: 3.75, pos: [0, 92, -100], tgt: [0, 130, -112] },
  { t: 4, pos: [-6.5, 122, -97.5], tgt: [-2.4, 120, -110] },
  { t: 4.5, pos: [-16, 26, -96], tgt: [-16, 2, -66] },
  { t: 5, pos: [-15.3, 2.1, -75], tgt: [-15.6, 1.75, -63] },
  { t: 5.5, pos: [-15.4, 2.1, -58], tgt: [-15.8, 1.75, -46] },
  { t: 6, pos: [-15.2, 2.5, -40], tgt: [-16.4, 1.7, -26] },
  { t: 6.55, pos: [-12, 2.6, -8], tgt: [-3, 1.3, 0] },
  { t: 7, pos: [-3.9, 1.65, 5.4], tgt: [-1.35, 1.2, 0] },
  { t: 7.6, pos: [-4, 1.8, 7.6], tgt: [-1.2, 1.1, 0] },
  { t: 8, pos: [-1.2, 1.3, 4.9], tgt: [-1.2, 1.05, 0] },
];

const POS_CURVE = new THREE.CatmullRomCurve3(CAM.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal");
const TGT_CURVE = new THREE.CatmullRomCurve3(CAM.map((k) => new THREE.Vector3(...k.tgt)), false, "centripetal");

const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
const smooth = (x: number) => x * x * (3 - 2 * x);

function camParam(t: number) {
  let i = 0;
  while (i < CAM.length - 2 && t > CAM[i + 1].t) i++;
  const a = CAM[i];
  const b = CAM[i + 1];
  let f = THREE.MathUtils.clamp((t - a.t) / (b.t - a.t), 0, 1);
  const ai = Number.isInteger(a.t);
  const bi = Number.isInteger(b.t);
  if (ai && bi) f = smoother(f);
  else if (ai) f = f * f;
  else if (bi) f = 1 - (1 - f) * (1 - f);
  return (i + f) / (CAM.length - 1);
}

/* ------------------------------------------------------------------ mood (fog, light) along the journey */

type Mood = { t: number; fog: string; near: number; far: number; light: number };
const MOOD: Mood[] = [
  { t: 0, fog: "#efece6", near: 14, far: 48, light: 1 },
  { t: 1, fog: "#e8e5df", near: 10, far: 36, light: 0.9 },
  { t: 1.32, fog: "#05070d", near: 8, far: 44, light: 0.3 },
  { t: 1.72, fog: "#05070d", near: 8, far: 44, light: 0.3 },
  { t: 1.8, fog: "#cfdcea", near: 60, far: 260, light: 1 },
  { t: 2.5, fog: "#cfdcea", near: 60, far: 260, light: 1 },
  { t: 2.6, fog: "#141b2b", near: 30, far: 140, light: 0.35 },
  { t: 3.55, fog: "#141b2b", near: 30, far: 140, light: 0.35 },
  { t: 3.65, fog: "#03040b", near: 300, far: 900, light: 0.35 },
  { t: 4.5, fog: "#03040b", near: 300, far: 900, light: 0.35 },
  { t: 4.6, fog: "#e7c7aa", near: 35, far: 170, light: 0.9 },
  { t: 6.5, fog: "#e7c7aa", near: 35, far: 170, light: 0.9 },
  { t: 7, fog: "#efece6", near: 14, far: 48, light: 1 },
  { t: 8, fog: "#efece6", near: 14, far: 48, light: 1 },
];

function moodAt(t: number, out: { color: THREE.Color; near: number; far: number; light: number }, ca: THREE.Color, cb: THREE.Color) {
  let i = 0;
  while (i < MOOD.length - 2 && t > MOOD[i + 1].t) i++;
  const a = MOOD[i];
  const b = MOOD[i + 1];
  const f = smooth(THREE.MathUtils.clamp((t - a.t) / (b.t - a.t), 0, 1));
  out.color.copy(ca.set(a.fog)).lerp(cb.set(b.fog), f);
  out.near = THREE.MathUtils.lerp(a.near, b.near, f);
  out.far = THREE.MathUtils.lerp(a.far, b.far, f);
  out.light = THREE.MathUtils.lerp(a.light, b.light, f);
}

/* ------------------------------------------------------------------ photographic environments (CC0, Poly Haven) */

const HDRI = {
  studio: "/hdri/studio_small_09.hdr",
  sky: "/hdri/kloofendal_48d_partly_cloudy_puresky.hdr",
  city: "/hdri/shanghai_bund.hdr",
  dawn: "/hdri/spruit_sunrise.hdr",
};
type EnvKey = keyof typeof HDRI;
const envs: Partial<Record<EnvKey, THREE.Texture>> = {};

function LoadEnv({ name }: { name: EnvKey }) {
  const tex = useLoader(RGBELoader, HDRI[name]);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  envs[name] = tex;
  return null;
}

/** Which photograph lights the scene (and, outdoors, fills the background) at this point of the journey. */
function envFor(t: number): { env: EnvKey; bg: boolean; intensity: number } {
  if (t > 1.76 && t < 2.56) return { env: "sky", bg: true, intensity: 1 };
  if (t >= 2.56 && t < 3.6) return { env: "city", bg: true, intensity: 1.15 };
  if (t > 4.55 && t < 6.75) return { env: "dawn", bg: true, intensity: 0.95 };
  return { env: "studio", bg: false, intensity: 1 };
}

/* ------------------------------------------------------------------ generated textures */

function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, url: () => cv.toDataURL() };
}

const glowTexture = () =>
  canvasTexture(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.2, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  }).tex;

const cloudPuffUrl = () =>
  canvasTexture(256, 256, (c) => {
    for (let i = 0; i < 30; i++) {
      const x = 128 + (Math.random() - 0.5) * 110;
      const y = 128 + (Math.random() - 0.5) * 90;
      const r = 30 + Math.random() * 70;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,0.35)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 256, 256);
    }
  }).url();

const windowTexture = () => {
  const { tex } = canvasTexture(128, 256, (c) => {
    c.fillStyle = "#000";
    c.fillRect(0, 0, 128, 256);
    for (let y = 6; y < 250; y += 8) {
      const lit = Math.random();
      for (let x = 4; x < 124; x += 7) {
        const r = Math.random();
        if (r < 0.22 + lit * 0.25) {
          c.fillStyle = r < 0.05 ? "#a8d4ff" : r < 0.18 ? "#ffd9a3" : "#ffbd78";
          c.globalAlpha = 0.45 + Math.random() * 0.55;
          c.fillRect(x, y, 4, 4);
        }
      }
    }
    c.globalAlpha = 1;
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
};

/* ------------------------------------------------------------------ organic geometry */

function noise3(x: number, y: number, z: number) {
  return (
    Math.sin(x * 1.7 + y * 0.3) * 0.5 +
    Math.sin(y * 2.3 + z * 1.1) * 0.3 +
    Math.sin(z * 3.1 + x * 2.2) * 0.2 +
    Math.sin((x + y + z) * 5.3) * 0.08
  );
}

/** A floating-island rock: flat top, jagged underside, earthy vertex colours. */
function makeRock(seed: number, depth = 1.9) {
  const geo = mergeVertices(new THREE.IcosahedronGeometry(1, 5));
  const p = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(p.count * 3);
  const v = new THREE.Vector3();
  const top = new THREE.Color("#6f6b5f");
  const mid = new THREE.Color("#8d8574");
  const deep = new THREE.Color("#4d483f");
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = noise3(v.x * 2 + seed, v.y * 2, v.z * 2 - seed);
    if (v.y > 0.15) {
      v.y = 0.15 + n * 0.02;
      v.x *= 1.0 + n * 0.05;
      v.z *= 1.0 + n * 0.05;
    } else {
      const k = 1 + n * 0.22;
      v.x *= k * (1 - (0.15 - v.y) * 0.35);
      v.z *= k * (1 - (0.15 - v.y) * 0.35);
      v.y = 0.15 - (0.15 - v.y) * depth * (1 + n * 0.25);
    }
    p.setXYZ(i, v.x, v.y, v.z);
    const h = THREE.MathUtils.clamp((v.y + depth) / (depth + 0.15), 0, 1);
    c.copy(deep).lerp(mid, h).lerp(top, h > 0.92 ? 1 : 0);
    c.offsetHSL(0, 0, n * 0.04);
    c.toArray(colors, i * 3);
  }
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

/* ------------------------------------------------------------------ shared bits */

function useVisible(ref: React.RefObject<THREE.Object3D>, from: number, to: number) {
  useFrame(() => {
    if (ref.current) ref.current.visible = journey.t > from && journey.t < to;
  });
}

function Tag({ position, show, children, tone = "ink" }: { position: V | THREE.Vector3; show: [number, number]; children: ReactNode; tone?: "ink" | "blue" | "green" | "red" | "dark" }) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    const [c, w] = show;
    const d = Math.abs(journey.t - c);
    const o = d >= w ? 0 : 1 - d / w;
    if (ref.current) {
      ref.current.style.opacity = o.toFixed(3);
      ref.current.style.transform = `translateY(${((1 - o) * 12).toFixed(1)}px)`;
      ref.current.style.visibility = o < 0.01 ? "hidden" : "visible";
    }
  });
  return (
    <Html position={position} center zIndexRange={[4, 0]} style={{ pointerEvents: "none" }}>
      <div ref={ref} className={`j-tag j-tag--${tone}`}>
        {children}
      </div>
    </Html>
  );
}

/** HTML printed onto a surface in the world: it turns, recedes and hides its back like the object. */
function Face({ position, width, show, children, far = 26 }: { position: V; width: number; show: [number, number]; children: ReactNode; far?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const anchor = useRef<THREE.Group>(null);
  const wp = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();
  useFrame(() => {
    const [c, w] = show;
    const d = Math.abs(journey.t - c);
    let o = d >= w ? 0 : 1 - d / w;
    if (anchor.current) {
      anchor.current.getWorldPosition(wp);
      o *= THREE.MathUtils.clamp((far - wp.distanceTo(camera.position)) / 6, 0, 1);
    }
    if (ref.current) {
      ref.current.style.opacity = o.toFixed(3);
      ref.current.style.visibility = o < 0.01 ? "hidden" : "visible";
    }
  });
  // 360 CSS px span `width` world units.
  return (
    <group ref={anchor} position={position}>
      <Html transform distanceFactor={(width * 400) / 360} zIndexRange={[3, 0]} style={{ pointerEvents: "auto" }}>
        <div ref={ref} className="j-face-wrap">
          {children}
        </div>
      </Html>
    </group>
  );
}

const glowMat = (hex: string, k = 2.4) => new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });

/** A see-through energy dome: bright at the rim, clear in the middle. */
function shieldMaterial(hex: string) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { color: { value: new THREE.Color(hex) }, time: { value: 0 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ vec4 w = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-w.xyz); vY = position.y;
      gl_Position = projectionMatrix * w; }`,
    fragmentShader: `uniform vec3 color; uniform float time; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.6); float bands = 0.5 + 0.5*sin(vY*28.0 - time*2.0);
      gl_FragColor = vec4(color * (f*1.6 + bands*0.05), f*0.75 + 0.03); }`,
  });
}

/* =================================================================== director: camera, light, mood, environment */

function Director() {
  const { scene, camera, size, gl } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const tmp = useMemo(() => ({ color: new THREE.Color(), near: 0, far: 0, light: 1 }), []);
  const ca = useMemo(() => new THREE.Color(), []);
  const cb = useMemo(() => new THREE.Color(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const off = useMemo(() => new THREE.Vector3(), []);
  const look = useRef(new THREE.Vector3(-1.35, 1.0, 0));
  const bgColor = useMemo(() => new THREE.Color("#efece6"), []);

  useMemo(() => {
    scene.background = bgColor;
    scene.fog = new THREE.Fog("#efece6", 14, 48);
  }, [scene, bgColor]);

  useFrame((state, dt) => {
    const t = THREE.MathUtils.clamp(journey.t, 0, LAST);

    moodAt(t, tmp, ca, cb);
    const fog = scene.fog as THREE.Fog;
    fog.color.copy(tmp.color);
    fog.near = tmp.near;
    fog.far = tmp.far;
    if (hemi.current) hemi.current.intensity = 0.35 * tmp.light;
    if (key.current) key.current.intensity = 1.6 * tmp.light;

    const e = envFor(t);
    const tex = envs[e.env] ?? envs.studio ?? null;
    if (scene.environment !== tex) scene.environment = tex;
    if (e.bg && envs[e.env]) {
      if (scene.background !== envs[e.env]) scene.background = envs[e.env]!;
      scene.backgroundIntensity = e.intensity;
      scene.backgroundBlurriness = 0.015;
    } else {
      if (scene.background !== bgColor) scene.background = bgColor;
      bgColor.copy(tmp.color);
    }
    gl.toneMappingExposure = e.env === "city" ? 1.15 : 1.0;

    const u = camParam(t);
    POS_CURVE.getPoint(u, pos);
    TGT_CURVE.getPoint(u, tgt);
    if (size.width / size.height < 0.9) {
      off.copy(pos).sub(tgt).multiplyScalar(0.45);
      pos.add(off);
      if (t < 0.5 || t > LAST - 0.4) {
        pos.x = 0;
        tgt.x = 0;
        tgt.y += 1.15;
      } else tgt.y += 0.9;
    }
    const el = state.clock.elapsedTime;
    pos.x += journey.mouse.x * 0.14 + Math.sin(el * 0.33) * 0.025;
    pos.y += journey.mouse.y * 0.08 + Math.cos(el * 0.29) * 0.02;

    const k = journey.calm ? 1 : 1 - Math.exp(-Math.min(dt, 0.05) * 2.6);
    camera.position.lerp(pos, k);
    look.current.lerp(tgt, k);
    camera.lookAt(look.current);
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#ffffff", "#cfc6b8", 0.35]} />
      <directionalLight
        ref={key}
        position={[4, 7, 6]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-1}
      />
    </>
  );
}

/* =================================================================== 0 · the studio */

function Studio({ lite }: { lite: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = journey.t < 1.4 || journey.t > 6.3;
  });
  return (
    <group ref={g}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]} receiveShadow>
        <circleGeometry args={[34, 96]} />
        {lite ? (
          <meshStandardMaterial color="#e4dfd5" roughness={0.8} />
        ) : (
          <MeshReflectorMaterial
            resolution={1024}
            blur={[500, 140]}
            mixBlur={1}
            mixStrength={0.7}
            mirror={0.3}
            roughness={0.9}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#e3ded4"
            metalness={0.05}
          />
        )}
      </mesh>
      <mesh position={[0, 0.06, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.86, 0.9, 0.12, 128]} />
        <meshPhysicalMaterial color="#efebe3" roughness={0.22} clearcoat={0.7} clearcoatRoughness={0.15} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.885, 0.885, 0.03, 128, 1, true]} />
        <meshStandardMaterial color="#b8bcc4" metalness={1} roughness={0.28} side={THREE.DoubleSide} />
      </mesh>
      <Suspense fallback={null}>
        <Avatar position={[0, 0.13, 0]} />
      </Suspense>
      <ContactShadows position={[0, 0.135, 0]} opacity={0.6} scale={2.2} blur={2.4} far={1.6} resolution={512} color="#3b352c" />
    </group>
  );
}

/* =================================================================== 1 · the server rack (a door into the system) */

function Rack() {
  const g = useRef<THREE.Group>(null);
  const leds = useRef<THREE.InstancedMesh>(null);
  const portal = useRef<THREE.Mesh>(null);
  const door = useRef<THREE.Group>(null);
  const N = 12 * 10;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => {
    const arr = new Float32Array(N * 3);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      c.set(Math.random() < 0.72 ? GREEN : Math.random() < 0.5 ? CYAN : "#ffb02e").multiplyScalar(2.2);
      c.toArray(arr, i * 3);
    }
    return arr;
  }, [N]);
  const phase = useMemo(() => Array.from({ length: N }, () => Math.random() * 10), [N]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (g.current) g.current.visible = journey.t < 1.45 || journey.t > 6.5;
    if (leds.current && g.current?.visible) {
      for (let i = 0; i < N; i++) {
        const row = Math.floor(i / 12);
        const col = i % 12;
        const on = Math.sin(t * (2 + (i % 5)) + phase[i]) > -0.2 ? 1 : 0.12;
        dummy.position.set(-0.43 + col * 0.026, 0.32 + row * 0.19, 0.507);
        dummy.scale.setScalar(on);
        dummy.updateMatrix();
        leds.current.setMatrixAt(i, dummy.matrix);
      }
      leds.current.instanceMatrix.needsUpdate = true;
    }
    const open = THREE.MathUtils.clamp((journey.t - 0.85) / 0.4, 0, 1);
    if (portal.current) {
      (portal.current.material as THREE.MeshBasicMaterial).opacity = open * 0.95;
      portal.current.scale.set(1, 0.15 + open * 0.85, 1);
    }
    if (door.current) door.current.rotation.y = -smooth(open) * 1.9;
  });

  return (
    <group ref={g} position={RACK}>
      <RoundedBox args={[1.25, 2.3, 0.96]} radius={0.025} smoothness={3} position={[0, 1.15, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#17191e" metalness={0.6} roughness={0.42} />
      </RoundedBox>
      {[-0.56, 0.56].map((x) => (
        <mesh key={x} position={[x, 1.15, 0.5]}>
          <boxGeometry args={[0.05, 2.15, 0.03]} />
          <meshStandardMaterial color="#9aa0a8" metalness={1} roughness={0.35} />
        </mesh>
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <group key={i} position={[0, 0.32 + i * 0.19, 0.48]}>
          <mesh>
            <boxGeometry args={[1.06, 0.16, 0.04]} />
            <meshStandardMaterial color={i % 3 === 0 ? "#2b2f36" : "#22252b"} metalness={0.85} roughness={0.32} />
          </mesh>
          <mesh position={[0.3, 0, 0.022]}>
            <boxGeometry args={[0.38, 0.1, 0.004]} />
            <meshStandardMaterial color="#0b0c0f" metalness={0.3} roughness={0.7} />
          </mesh>
          {[-0.5, 0.5].map((x) => (
            <mesh key={x} position={[x, 0, 0.03]}>
              <boxGeometry args={[0.025, 0.12, 0.02]} />
              <meshStandardMaterial color="#c9ced6" metalness={1} roughness={0.2} />
            </mesh>
          ))}
        </group>
      ))}
      <instancedMesh ref={leds} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry args={[0.01, 0.01, 0.006]}>
          <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </boxGeometry>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
      <mesh ref={portal} position={[0, 1.15, 0.47]}>
        <planeGeometry args={[1.06, 2.0]} />
        <meshBasicMaterial color={new THREE.Color(CYAN).multiplyScalar(2.6)} transparent opacity={0} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* =================================================================== fibre tunnel */

function FibreTunnel() {
  const g = useRef<THREE.Group>(null);
  const streaks = useRef<THREE.InstancedMesh>(null);
  const N = 1100;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(
    () =>
      Array.from({ length: N }, () => ({
        a: Math.random() * Math.PI * 2,
        r: 0.8 + Math.pow(Math.random(), 0.6) * 2.2,
        z: Math.random(),
        len: 0.5 + Math.random() * 3,
        speed: 0.25 + Math.random() * 0.6,
      })),
    [],
  );
  const colors = useMemo(() => {
    const arr = new Float32Array(N * 3);
    const c = new THREE.Color();
    const pal = [CYAN, BLUE, "#ffffff", GREEN, "#8a7dff", CYAN];
    for (let i = 0; i < N; i++) {
      c.set(pal[i % pal.length]).multiplyScalar(1.4 + Math.random() * 1.8);
      c.toArray(arr, i * 3);
    }
    return arr;
  }, []);
  const L = TUNNEL.z0 - TUNNEL.z1;

  useFrame((s) => {
    const vis = journey.t > 1.05 && journey.t < 1.85;
    if (g.current) g.current.visible = vis;
    if (!vis || !streaks.current) return;
    const t = s.clock.elapsedTime;
    data.forEach((d, i) => {
      const z = TUNNEL.z0 - ((d.z + t * d.speed * 0.08) % 1) * L;
      const wob = Math.sin(t * 0.6 + d.a * 3) * 0.05;
      dummy.position.set(TUNNEL.x + Math.cos(d.a) * (d.r + wob), TUNNEL.y + Math.sin(d.a) * (d.r + wob), z);
      dummy.scale.set(1, 1, d.len);
      dummy.updateMatrix();
      streaks.current!.setMatrixAt(i, dummy.matrix);
    });
    streaks.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={g}>
      <instancedMesh ref={streaks} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry args={[0.01, 0.01, 1]}>
          <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </boxGeometry>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
      <Tag position={[TUNNEL.x, TUNNEL.y + 0.55, -24]} show={[1.5, 0.18]} tone="dark">
        <b>mTLS · NATS bus</b>
        <span>riding the fibre to the cloud</span>
      </Tag>
    </group>
  );
}

/* =================================================================== 2 · above the clouds: the WSO2 platform */

function CloudLayer({ lite }: { lite: boolean }) {
  const g = useRef<THREE.Group>(null);
  useVisible(g, 1.6, 2.8);
  const url = useMemo(cloudPuffUrl, []);
  const banks = useMemo(
    () =>
      Array.from({ length: lite ? 7 : 13 }, (_, i) => ({
        pos: [SKY.x + (Math.random() - 0.5) * 90, -5 + Math.random() * 2.5, SKY.z + (Math.random() - 0.5) * 70] as V,
        bounds: [16 + Math.random() * 10, 2.5, 10 + Math.random() * 6] as V,
        seed: i + 1,
      })),
    [lite],
  );
  return (
    <group ref={g}>
      <Clouds material={THREE.MeshLambertMaterial} texture={url} limit={lite ? 200 : 400} frustumCulled={false}>
        {banks.map((b) => (
          <Cloud key={b.seed} seed={b.seed} position={b.pos} bounds={b.bounds} segments={lite ? 22 : 36} volume={14} color="#ffffff" fade={60} speed={0.08} growth={6} opacity={0.9} />
        ))}
        <Cloud seed={99} position={[2, -8, -86]} bounds={[16, 3, 16]} segments={lite ? 20 : 34} volume={12} color="#e9eef6" fade={30} speed={0.1} />
      </Clouds>
    </group>
  );
}

function Packets({ from, to, color, count = 5, speed = 0.35, stopAt = 1, lift = 1.4 }: { from: THREE.Vector3; to: THREE.Vector3; color: string; count?: number; speed?: number; stopAt?: number; lift?: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const curve = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, lift, 0));
    return new THREE.QuadraticBezierCurve3(from, mid, to);
  }, [from, to, lift]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 64, 0.012, 6, false), [curve]);
  const mat = useMemo(() => glowMat(color, 2.6), [color]);
  const ahead = useMemo(() => new THREE.Vector3(), []);
  useFrame((s) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (s.clock.elapsedTime * speed + i / count) % 1;
      const p = Math.min(u, stopAt);
      curve.getPoint(p, m.position);
      curve.getPoint(Math.min(1, p + 0.01), ahead);
      m.lookAt(ahead);
      m.rotateX(Math.PI / 2);
      const fade = u > stopAt ? 0 : Math.sin(Math.PI * (p / stopAt));
      m.scale.setScalar(0.001 + fade);
    });
  });
  return (
    <group>
      <mesh geometry={tube}>
        <meshBasicMaterial color={color} transparent opacity={0.28} toneMapped={false} />
      </mesh>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} material={mat}>
          <capsuleGeometry args={[0.05, 0.24, 4, 10]} />
        </mesh>
      ))}
    </group>
  );
}

function ServerNode({ tint }: { tint: string }) {
  return (
    <group>
      <RoundedBox args={[0.5, 0.44, 0.5]} radius={0.03} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#1c1f25" metalness={0.75} roughness={0.35} />
      </RoundedBox>
      {[0.12, 0.0, -0.12].map((y) => (
        <mesh key={y} position={[0, y, 0.252]}>
          <boxGeometry args={[0.42, 0.06, 0.004]} />
          <meshStandardMaterial color="#2c3038" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0.16, 0.16, 0.256]}>
        <boxGeometry args={[0.05, 0.012, 0.002]} />
        <primitive object={glowMat(tint, 2.2)} attach="material" />
      </mesh>
    </group>
  );
}

function Island({ at, label, sub, tint, planned, seed }: { at: THREE.Vector3; label: string; sub: string; tint: string; planned?: boolean; seed: number }) {
  const g = useRef<THREE.Group>(null);
  const rock = useMemo(() => makeRock(seed), [seed]);
  const shield = useMemo(() => shieldMaterial(GREEN), []);
  useFrame((s) => {
    if (g.current) g.current.position.y = at.y + Math.sin(s.clock.elapsedTime * 0.5 + at.x) * 0.15;
    shield.uniforms.time.value = s.clock.elapsedTime;
  });
  return (
    <group ref={g} position={at}>
      <mesh geometry={rock} scale={[2, 1.2, 2]} position={[0, -0.25, 0]} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} transparent={planned} opacity={planned ? 0.4 : 1} />
      </mesh>
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[1.55, 1.6, 0.1, 64]} />
        <meshStandardMaterial color="#cfccc4" roughness={0.85} transparent={planned} opacity={planned ? 0.4 : 1} />
      </mesh>
      {!planned &&
        [-0.62, 0, 0.62].map((x) =>
          [-0.4, 0.4].map((z) => (
            <group key={`${x}${z}`} position={[x, 0.27, z]}>
              <ServerNode tint={tint} />
            </group>
          )),
        )}
      {!planned && (
        <mesh material={shield} position={[0, 0.05, 0]}>
          <sphereGeometry args={[1.75, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
      )}
      <Tag position={[0, 2.1, 0]} show={[2, 0.45]}>
        <b>{label}</b>
        <span>{sub}</span>
      </Tag>
    </group>
  );
}

function SkyPlatform() {
  const g = useRef<THREE.Group>(null);
  const certs = useRef<THREE.Group>(null);
  useVisible(g, 1.6, 2.75);
  const cp = SKY;
  const aks = useMemo(() => cp.clone().add(new THREE.Vector3(-7, -1.6, 4)), [cp]);
  const eks = useMemo(() => cp.clone().add(new THREE.Vector3(7, -1.6, 4)), [cp]);
  const onprem = useMemo(() => cp.clone().add(new THREE.Vector3(0, -2.4, 9)), [cp]);
  const core = useMemo(() => cp.clone().add(new THREE.Vector3(0, 0.6, 0)), [cp]);
  const rock = useMemo(() => makeRock(7, 2.2), []);
  useFrame((s) => {
    if (certs.current) certs.current.rotation.y = s.clock.elapsedTime * 0.18;
  });
  return (
    <group ref={g}>
      <group position={cp}>
        <mesh geometry={rock} scale={[3, 1.6, 2.5]} position={[0, -0.3, 0]} castShadow receiveShadow>
          <meshStandardMaterial vertexColors roughness={0.95} />
        </mesh>
        <RoundedBox args={[4.4, 0.18, 3.2]} radius={0.06} smoothness={3} castShadow receiveShadow>
          <meshStandardMaterial color="#d8d5ce" roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[3.6, 1.4, 2.3]} radius={0.12} smoothness={4} position={[0, 0.8, 0]}>
          <meshPhysicalMaterial color="#eef4ff" transmission={0.94} thickness={0.6} roughness={0.06} ior={1.45} />
        </RoundedBox>
        {["Workflows", "Events", "CD", "ESO"].map((n, i) => (
          <group key={n} position={[-1.2 + i * 0.8, 0.35, 0]}>
            <RoundedBox args={[0.55, 0.62, 1.3]} radius={0.03} smoothness={2} position={[0, 0.31, 0]} castShadow>
              <meshStandardMaterial color="#1b1e25" metalness={0.7} roughness={0.3} />
            </RoundedBox>
            <mesh position={[0, 0.52, 0.656]}>
              <boxGeometry args={[0.4, 0.02, 0.003]} />
              <primitive object={glowMat(i === 3 ? GREEN : BLUE, 2)} attach="material" />
            </mesh>
          </group>
        ))}
        <group ref={certs} position={[0, 1.0, 0]}>
          {Array.from({ length: 22 }, (_, i) => {
            const a = (i / 22) * Math.PI * 2;
            return (
              <group key={i} position={[Math.cos(a) * 3.6, Math.sin(i * 1.7) * 0.35, Math.sin(a) * 3.6]} rotation={[0, -a + Math.PI / 2, 0]}>
                <mesh>
                  <planeGeometry args={[0.26, 0.34]} />
                  <meshStandardMaterial color="#fbfaf6" roughness={0.6} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0, -0.09, 0.002]}>
                  <planeGeometry args={[0.07, 0.07]} />
                  <primitive object={glowMat(GREEN, 1.8)} attach="material" />
                </mesh>
              </group>
            );
          })}
        </group>
        <Tag position={[0, 2.4, 0]} show={[2, 0.45]} tone="blue">
          <b>Control plane</b>
          <span>Argo Workflows · Events · CD · ESO</span>
        </Tag>
        <Tag position={[4.3, 1.4, 0]} show={[2, 0.45]} tone="green">
          <b>20+ services</b>
          <span>CA-signed certs · auto-rotated · prod</span>
        </Tag>
      </group>

      <Island at={aks} label="AKS data plane" sub="Azure" tint={AZURE} seed={3} />
      <Island at={eks} label="EKS data plane" sub="AWS" tint={AWS} seed={5} />
      <Island at={onprem} label="On-prem" sub="planned" tint="#9aa1ad" planned seed={9} />

      <Packets from={aks.clone().add(new THREE.Vector3(0, 0.6, 0))} to={core} color={CYAN} lift={2} />
      <Packets from={eks.clone().add(new THREE.Vector3(0, 0.6, 0))} to={core} color={CYAN} speed={0.3} lift={2} />
      <Packets from={aks.clone().add(new THREE.Vector3(-5, 2.5, 6))} to={aks.clone().add(new THREE.Vector3(-1.2, 0.9, 1.2))} color={RED} count={2} speed={0.26} stopAt={0.97} lift={0.6} />
      <Packets from={eks.clone().add(new THREE.Vector3(5, 2.5, 6))} to={eks.clone().add(new THREE.Vector3(1.2, 0.9, 1.2))} color={RED} count={2} speed={0.22} stopAt={0.97} lift={0.6} />
      <Tag position={[cp.x, cp.y - 1.2, cp.z + 6.5]} show={[2, 0.45]} tone="green">
        <b>0 inbound</b>
        <span>data planes dial out over mTLS · attacks stop at the shield</span>
      </Tag>
    </group>
  );
}

/* =================================================================== 3 · night city: PageRewind */

function NightCity({ lite }: { lite: boolean }) {
  const g = useRef<THREE.Group>(null);
  useVisible(g, 2.45, 3.72);
  const win = useMemo(windowTexture, []);
  const glow = useMemo(glowTexture, []);
  const blocks = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number }[] = [];
    for (let i = -8; i <= 8; i++)
      for (let j = -8; j <= 8; j++) {
        if (i === 0 && j === 0) continue;
        if (Math.random() < 0.1) continue;
        const dist = Math.hypot(i, j);
        const h = 2.5 + Math.random() * 6 + Math.max(0, 7 - dist) * 1.5 + (Math.random() < 0.08 ? 10 : 0);
        out.push({ x: i * 4 + (Math.random() - 0.5), z: j * 4 + (Math.random() - 0.5), w: 2.1 + Math.random() * 1.1, d: 2.1 + Math.random() * 1.1, h });
      }
    return out;
  }, []);
  const city = useRef<THREE.InstancedMesh>(null);
  const roofs = useMemo(() => blocks.map((b) => new THREE.Vector3(CITY.x + b.x, CITY.y + b.h, CITY.z + b.z)), [blocks]);
  const tower = useMemo(() => new THREE.Vector3(CITY.x, CITY.y + 19, CITY.z), []);
  const phone = useMemo(() => new THREE.Vector3(CITY.x - 8, CITY.y + 17, CITY.z + 7), []);
  const placed = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const alerts = useRef<THREE.InstancedMesh>(null);
  const NA = 100;
  const seeds = useMemo(() => Array.from({ length: NA }, (_, i) => ({ roof: (i * 7) % roofs.length, d: Math.random(), s: 0.7 + Math.random() * 0.6 })), [roofs.length]);
  const orb = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Sprite>(null);
  const beam = useRef<THREE.Mesh>(null);
  const ack = useRef<THREE.Mesh>(null);
  const beacons = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const beamGeo = useMemo(() => {
    const dir = phone.clone().sub(tower);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(0.035, 0.035, len, 8, 1, true);
    geo.translate(0, len / 2, 0);
    geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()));
    return geo;
  }, [phone, tower]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (city.current && !placed.current) {
      blocks.forEach((b, i) => {
        dummy.position.set(CITY.x + b.x, CITY.y + b.h / 2, CITY.z + b.z);
        dummy.scale.set(b.w, b.h, b.d);
        dummy.updateMatrix();
        city.current!.setMatrixAt(i, dummy.matrix);
        if (beacons.current) {
          dummy.position.set(CITY.x + b.x, CITY.y + b.h + 0.05, CITY.z + b.z);
          dummy.scale.setScalar(b.h > 12 ? 1 : 0);
          dummy.updateMatrix();
          beacons.current.setMatrixAt(i, dummy.matrix);
        }
      });
      city.current.instanceMatrix.needsUpdate = true;
      if (beacons.current) beacons.current.instanceMatrix.needsUpdate = true;
      placed.current = true;
    }
    if (!g.current?.visible) return;
    if (alerts.current) {
      seeds.forEach((sd, i) => {
        const u = (t * 0.17 * sd.s + sd.d) % 1;
        tmp.lerpVectors(roofs[sd.roof], tower, smooth(u));
        tmp.y += Math.sin(Math.PI * u) * 7;
        dummy.position.copy(tmp);
        dummy.scale.setScalar(0.17 * (1 - u * 0.55));
        dummy.updateMatrix();
        alerts.current!.setMatrixAt(i, dummy.matrix);
      });
      alerts.current.instanceMatrix.needsUpdate = true;
    }
    const pulse = 1 + Math.sin(t * 3.2) * 0.08;
    if (orb.current) orb.current.scale.setScalar(0.7 * pulse);
    if (halo.current) halo.current.scale.setScalar(8 + Math.sin(t * 3.2) * 0.9);
    const cyc = (t * 0.35) % 1;
    if (beam.current) {
      beam.current.scale.set(1, Math.min(1, cyc * 3), 1);
      (beam.current.material as THREE.MeshBasicMaterial).opacity = cyc < 0.6 ? 0.85 : 0;
    }
    if (ack.current) {
      const a = THREE.MathUtils.clamp((cyc - 0.45) * 3, 0, 1);
      ack.current.scale.setScalar(0.4 + a * 1.4);
      (ack.current.material as THREE.MeshBasicMaterial).opacity = (1 - a) * 0.9;
    }
  });

  return (
    <group ref={g}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CITY.x, CITY.y, CITY.z]}>
        <planeGeometry args={[110, 110]} />
        {lite ? (
          <meshStandardMaterial color="#0c1018" roughness={0.35} metalness={0.6} />
        ) : (
          <MeshReflectorMaterial resolution={512} blur={[300, 80]} mixBlur={1} mixStrength={2.2} mirror={0.6} roughness={0.55} depthScale={0.8} color="#0b0f17" metalness={0.6} />
        )}
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <group key={i}>
          <mesh position={[CITY.x + (i - 4) * 8 + 2, CITY.y + 0.03, CITY.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.1, 72]} />
            <primitive object={glowMat("#ffb36b", 1.25)} attach="material" />
          </mesh>
          <mesh position={[CITY.x, CITY.y + 0.03, CITY.z + (i - 4) * 8 + 2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[0.1, 72]} />
            <primitive object={glowMat("#ff8c5a", 1.1)} attach="material" />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={city} args={[undefined, undefined, blocks.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1a2030" roughness={0.3} metalness={0.7} emissive="#ffffff" emissiveMap={win} emissiveIntensity={1.35} envMapIntensity={1.2} />
      </instancedMesh>
      <instancedMesh ref={beacons} args={[undefined, undefined, blocks.length]} frustumCulled={false}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <primitive object={glowMat(RED, 2.2)} attach="material" />
      </instancedMesh>
      <mesh position={[CITY.x, CITY.y + 9, CITY.z]}>
        <boxGeometry args={[2.6, 18, 2.6]} />
        <meshStandardMaterial color="#121725" metalness={0.75} roughness={0.25} emissive="#ffffff" emissiveMap={win} emissiveIntensity={0.9} />
      </mesh>
      <mesh ref={orb} position={tower}>
        <sphereGeometry args={[1, 32, 32]} />
        <primitive object={glowMat(RED, 3)} attach="material" />
      </mesh>
      <sprite ref={halo} position={tower}>
        <spriteMaterial map={glow} color={RED} transparent opacity={0.55} depthWrite={false} toneMapped={false} />
      </sprite>
      <instancedMesh ref={alerts} args={[undefined, undefined, NA]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <primitive object={glowMat(RED, 2.4)} attach="material" />
      </instancedMesh>
      <mesh ref={beam} geometry={beamGeo} position={tower}>
        <meshBasicMaterial color={new THREE.Color(CYAN).multiplyScalar(2.5)} transparent opacity={0.8} toneMapped={false} />
      </mesh>
      <group position={phone} rotation={[0, 0.5, 0]}>
        <RoundedBox args={[1.5, 3.0, 0.14]} radius={0.18} smoothness={5}>
          <meshStandardMaterial color="#0d0f14" metalness={0.9} roughness={0.2} />
        </RoundedBox>
        <mesh position={[0, 0, 0.075]}>
          <planeGeometry args={[1.36, 2.8]} />
          <meshBasicMaterial color={new THREE.Color("#141c33").multiplyScalar(1.6)} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.65, 0.08]}>
          <planeGeometry args={[1.15, 0.46]} />
          <primitive object={glowMat(RED, 1.3)} attach="material" />
        </mesh>
        <mesh position={[0, 0.25, 0.08]}>
          <planeGeometry args={[1.15, 0.18]} />
          <meshBasicMaterial color="#3a4766" />
        </mesh>
        <mesh ref={ack} position={[0, -0.6, 0.09]}>
          <ringGeometry args={[0.3, 0.34, 48]} />
          <meshBasicMaterial color={new THREE.Color(GREEN).multiplyScalar(2.2)} transparent toneMapped={false} />
        </mesh>
      </group>
      <Tag position={[phone.x, phone.y + 2.2, phone.z]} show={[3, 0.45]} tone="red">
        <b>Incident #1 · paged</b>
        <span>on-call via Telegram · escalates if unanswered</span>
      </Tag>
      <Tag position={[tower.x, tower.y + 2.2, tower.z]} show={[3, 0.45]} tone="red">
        <b>100 alerts → 1 incident</b>
        <span>outbox · idempotent consumers · quorum queues</span>
      </Tag>
    </group>
  );
}

/* =================================================================== 4 · open-source galaxy */

function Galaxy({ lite }: { lite: boolean }) {
  const g = useRef<THREE.Group>(null);
  useVisible(g, 3.45, 4.62);
  const glow = useMemo(glowTexture, []);
  const orbit = useRef<THREE.Group>(null);
  const disk = useRef<THREE.Points>(null);
  const cards = useMemo(
    () =>
      contributions.map((c, i, all) => ({
        kind: c.status,
        c,
        a: (i / all.length) * Math.PI * 2 + (i % 2) * 0.18,
        r: i % 2 ? 6.6 : 5.0,
        y: Math.sin(i * 2.1) * 0.9,
      })),
    [],
  );
  const diskGeo = useMemo(() => {
    const n = lite ? 2500 : 6000;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const arm = i % 3;
      const r = 1.8 + Math.pow(Math.random(), 1.6) * 14;
      const a = arm * ((Math.PI * 2) / 3) + r * 0.45 + (Math.random() - 0.5) * 0.6;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5 * (1.2 - r / 16);
      pos[i * 3 + 2] = Math.sin(a) * r;
      c.set(r < 4 ? "#ffe2b8" : arm === 0 ? "#8fb0ff" : arm === 1 ? "#c79bff" : "#7de3ff").multiplyScalar(1.2 + Math.random());
      c.toArray(col, i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return geo;
  }, [lite]);
  const cam = useThree((st) => st.camera);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (orbit.current) {
      orbit.current.rotation.y = t * 0.1;
      // keep every card turned toward the viewer so its text always reads the right way round
      orbit.current.children.forEach((c) => c.lookAt(cam.position));
    }
    if (disk.current) disk.current.rotation.y = t * 0.03;
  });
  return (
    <group ref={g}>
      <group position={SPACE}>
        <Stars radius={70} depth={60} count={lite ? 2000 : 5000} factor={3} saturation={0.3} fade speed={0.4} />
        <points ref={disk} geometry={diskGeo} position={[6, -6, -26]} rotation={[0.9, 0, 0.3]}>
          <pointsMaterial size={0.09} vertexColors transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} sizeAttenuation />
        </points>
        <sprite position={[6, -6, -26]} scale={[16, 16, 1]}>
          <spriteMaterial map={glow} color="#ffd9a8" transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <mesh>
          <sphereGeometry args={[0.55, 48, 48]} />
          <meshBasicMaterial color={new THREE.Color("#fff1d6").multiplyScalar(1.8)} toneMapped={false} />
        </mesh>
        <sprite scale={[6, 6, 1]}>
          <spriteMaterial map={glow} color="#ffd8a0" transparent opacity={0.55} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <pointLight color="#ffe6c4" intensity={14} distance={30} decay={2} />
        <group ref={orbit} rotation={[0.25, 0, 0.12]}>
          {cards.map((c, i) => (
            <group key={i} position={[Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r]}>
              <RoundedBox args={[1.5, 0.9, 0.03]} radius={0.05} smoothness={3}>
                <meshPhysicalMaterial color={c.kind === "merged" ? "#d8f3e2" : "#dde3f2"} roughness={0.25} metalness={0.15} clearcoat={1} />
              </RoundedBox>
              <Face position={[0, 0, 0.02]} width={1.4} show={[4, 0.5]}>
                <div className={`j-face j-face--${c.kind}`}>
                  <em>{statusLabel[c.c.status]}</em>
                  <b>
                    {c.c.repo.split("/")[1]} <span>{c.c.ref}</span>
                  </b>
                  <p>{c.c.title}</p>
                </div>
              </Face>
            </group>
          ))}
        </group>
        <Tag position={[0, 2.8, 0]} show={[4, 0.45]} tone="green">
          <b>{contributions.filter((c) => c.status === "merged").length} merged · {contributions.filter((c) => c.status === "review").length} in review · {contributions.filter((c) => c.status === "issue").length} issues</b>
          <span>Argo · Kubernetes · Prometheus · WSO2 · OpenChoreo</span>
        </Tag>
      </group>
    </group>
  );
}

/* =================================================================== 5 + 6 · the sunrise road: projects, then experience */

/** One honest line per project (from the CV and project records). */
const PROJECT_LINES: Record<string, string> = {
  "Cloud Reliability Platform (SRE Lab)": "Kubernetes lab with Prometheus, Grafana and Alertmanager; self-healing proven by chaos tests.",
  "Private 5G Network Implementation": "5G core (Aether SD-Core) on Kubernetes and an edge UPF on a Raspberry Pi, with SLTMobitel.",
  "Mini 5G Edge Network Testbed (Cloud-Native Networking)": "Containerised network functions with Prometheus and Grafana monitoring.",
  "P-E-BO Desk Companion": "AI desk robot: React Native app, Firebase and AWS Rekognition. ICIIS 2025 3rd place.",
  "MONA Dashboard": "Machine production-rate dashboard: React, Node.js and MongoDB.",
  "AI-Driven Automated Feedback and Tutoring System": "Four-agent LLM grading pipeline in Moodle; the rubric agent cut grading error by 47%.",
  "Smart Home Energy Automation": "React Native app with Firebase real-time sync for an ESP32 home-energy system.",
};
const PROJECTS = profile.projects
  .filter((p) => !["Pull-Based Multi-Cloud CI/CD Platform", "PKI Certificate Automation", "PageRewind"].includes(p.title))
  .map((p) => ({
    title: p.title.replace(/\s*\(.*\)$/, ""),
    when: p.timeframe,
    line: PROJECT_LINES[p.title] ?? p.description,
    tech: p.tech.slice(0, 4) as readonly string[],
    link: (p.links as { repo?: string; demo?: string }).repo ?? (p.links as { demo?: string }).demo,
  }));

function Sign({ at, left, i, p }: { at: V; left: boolean; i: number; p: (typeof PROJECTS)[number] }) {
  return (
    <group position={at} rotation={[0, left ? 2.62 : -2.62, 0]}>
      {[-0.95, 0.95].map((x) => (
        <mesh key={x} position={[x, 0.85, -0.04]} castShadow>
          <cylinderGeometry args={[0.035, 0.04, 1.7, 12]} />
          <meshStandardMaterial color="#6f747c" metalness={0.9} roughness={0.35} />
        </mesh>
      ))}
      <RoundedBox args={[2.3, 1.5, 0.06]} radius={0.04} smoothness={3} position={[0, 2.25, -0.04]} castShadow>
        <meshStandardMaterial color="#1c1f25" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      <Face position={[0, 2.25, 0.0]} width={2.16} show={[5.4, 0.9]} far={20}>
        <div className="j-sign">
          <em>
            {String(i + 1).padStart(2, "0")} · {p.when}
          </em>
          <b>{p.title}</b>
          <p>{p.line}</p>
          <div>
            {p.tech.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          {p.link && (
            <a href={p.link} target="_blank" rel="noopener noreferrer">
              View code ↗
            </a>
          )}
        </div>
      </Face>
    </group>
  );
}

const MILESTONES = [
  { label: "2022", sub: "Computer Engineering · Peradeniya" },
  { label: "2024", sub: "Teaching assistant · 40+ students" },
  { label: "2025", sub: "P-E-BO · ICIIS 3rd place" },
  { label: "2026", sub: "SRE Intern · WSO2" },
  { label: "Now", sub: "PageRewind v0.2.0 · open to roles" },
];

function Stone({ at, h, seed, children, show, tone }: { at: V; h: number; seed: number; children?: ReactNode; show: [number, number]; tone?: "ink" | "green" }) {
  const tilt = ((seed * 37) % 7) / 100 - 0.03;
  return (
    <group position={at} rotation={[0, at[0] < ROAD.x ? 0.45 : -0.45, tilt]}>
      {/* polished granite slab on a rough plinth */}
      <RoundedBox args={[0.95, h, 0.24]} radius={0.05} smoothness={4} position={[0, h / 2 + 0.18, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={seed % 2 ? "#3b3d42" : "#55524d"} roughness={0.32} metalness={0.05} clearcoat={0.5} clearcoatRoughness={0.3} />
      </RoundedBox>
      <RoundedBox args={[1.15, 0.2, 0.42]} radius={0.03} smoothness={2} position={[0, 0.1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#9b9388" roughness={0.95} />
      </RoundedBox>
      <mesh position={[0, h * 0.78 + 0.18, 0.122]}>
        <boxGeometry args={[0.55, 0.018, 0.002]} />
        <meshStandardMaterial color="#c9a86a" metalness={1} roughness={0.25} />
      </mesh>
      {children && (
        <Tag position={[0, h + 0.75, 0]} show={show} tone={tone}>
          {children}
        </Tag>
      )}
    </group>
  );
}

function SunriseRoad() {
  const g = useRef<THREE.Group>(null);
  useVisible(g, 4.4, 6.7);
  const dash = useRef<THREE.Group>(null);
  const len = ROAD.z1 - ROAD.z0;
  const mid = (ROAD.z0 + ROAD.z1) / 2;
  const hills = useMemo(() => {
    const geo = new THREE.PlaneGeometry(240, 240, 120, 120);
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const dRoad = Math.abs(x);
      let h = Math.max(0, dRoad - 6) * 0.08 * (1 + noise3(x * 0.05, y * 0.05, 1) * 0.8) + noise3(x * 0.1, y * 0.1, 2) * 0.25;
      // sink the land around the studio so it never rises through the studio floor
      const dStudio = Math.hypot(x - -ROAD.x, y - mid);
      if (dStudio < 24) h = THREE.MathUtils.lerp(-0.6, h, dStudio / 24);
      if (dRoad < 4) h = Math.min(h, -0.08);
      p.setZ(i, h);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
  useFrame((s) => {
    if (dash.current) dash.current.position.z = ((s.clock.elapsedTime * 1.2) % 2) - 1;
  });
  return (
    <group ref={g}>
      <mesh geometry={hills} rotation={[-Math.PI / 2, 0, 0]} position={[ROAD.x, -0.05, mid]} receiveShadow>
        <meshStandardMaterial color="#a89a7c" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROAD.x, 0.04, mid]} receiveShadow>
        <planeGeometry args={[3.4, len + 10]} />
        <meshStandardMaterial color="#2b2d31" roughness={0.7} metalness={0.1} />
      </mesh>
      {[-1.62, 1.62].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[ROAD.x + x, 0.015, mid]}>
          <planeGeometry args={[0.08, len + 10]} />
          <meshBasicMaterial color="#e9e2d4" />
        </mesh>
      ))}
      <group ref={dash}>
        {Array.from({ length: Math.ceil(len / 2) + 4 }, (_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[ROAD.x, 0.02, ROAD.z0 - 4 + i * 2]}>
            <planeGeometry args={[0.1, 0.9]} />
            <meshBasicMaterial color="#f4efe6" />
          </mesh>
        ))}
      </group>
      {PROJECTS.map((p, i) => (
        <Sign key={p.title} i={i} p={p} left={i % 2 === 0} at={[ROAD.x + (i % 2 === 0 ? -2.7 : 2.7), 0, ROAD.z0 + 9 + i * 4.2]} />
      ))}
      {MILESTONES.map((m, i) => (
        <Stone key={m.label} at={[ROAD.x + (i % 2 ? 3.2 : -3.2), 0, ROAD.z0 + 38 + i * 5]} h={1.7 + i * 0.25} seed={40 + i} show={[6, 0.45]} tone={i === MILESTONES.length - 1 ? "green" : "ink"}>
          <b>{m.label}</b>
          <span>{m.sub}</span>
        </Stone>
      ))}
    </group>
  );
}

/* =================================================================== 7 · toolbox: the tools orbit him */

const SKILLS = [
  "Kubernetes", "Terraform", "Argo CD", "Argo Workflows", "Helm", "Docker", "AWS", "Azure", "GitOps",
  "Prometheus", "Grafana", "Alertmanager", "Linux", "Bash", "Python", "Java", "PKI · mTLS", "OIDC",
  "Workload Identity", "External Secrets", "TCP/IP", "CI/CD",
];

function SkillOrbit() {
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (g.current) {
      g.current.rotation.y = st.clock.elapsedTime * 0.12;
      g.current.visible = journey.t > 6.5 && journey.t < 7.6;
    }
  });
  return (
    <group ref={g} position={[0, 0.15, 0]}>
      {SKILLS.map((k, i) => {
        const a = i * 2.39996;
        const r = 1.15 + (i % 3) * 0.22;
        return (
          <Tag key={k} position={[Math.cos(a) * r, 0.35 + (i / SKILLS.length) * 1.9, Math.sin(a) * r]} show={[7, 0.45]} tone={i % 4 === 0 ? "blue" : "ink"}>
            <b>{k}</b>
          </Tag>
        );
      })}
    </group>
  );
}

/* =================================================================== world */

/** Mount a part of the world only while the camera is near it, so far-away zones cost nothing per frame. */
function Zone({ from, to, children }: { from: number; to: number; children: ReactNode }) {
  const inside = () => journey.t > from && journey.t < to;
  const [mounted, setMounted] = useState(inside);
  const ref = useRef(mounted);
  useFrame(() => {
    const n = inside();
    if (n !== ref.current) {
      ref.current = n;
      setMounted(n);
    }
  });
  return mounted ? <>{children}</> : null;
}

// Debug aid: ?off=clouds,city,... skips parts of the world.
const OFF = new Set(typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("off") ?? "").split(",") : []);
const on = (name: string) => !OFF.has(name);

function World({ lite }: { lite: boolean }) {
  return (
    <>
      <Suspense fallback={null}>
        <LoadEnv name="studio" />
      </Suspense>
      {on("hdri") && (
        <Suspense fallback={null}>
          <LoadEnv name="sky" />
          <LoadEnv name="city" />
          <LoadEnv name="dawn" />
        </Suspense>
      )}
      <Director />
      <pointLight position={[-0.8, 1.8, 2.2]} intensity={1.4} distance={6} color="#fff1e0" />

      {on("studio") && <Studio lite={lite} />}
      <Zone from={6.4} to={7.7}>
        <SkillOrbit />
      </Zone>
      {on("rack") && <Rack />}
      {on("tunnel") && (
        <Zone from={0.75} to={2.0}>
          <FibreTunnel />
        </Zone>
      )}
      {on("clouds") && (
        <Zone from={1.4} to={2.9}>
          <Suspense fallback={null}>
            <CloudLayer lite={lite} />
          </Suspense>
        </Zone>
      )}
      {on("platform") && (
        <Zone from={1.4} to={2.9}>
          <SkyPlatform />
        </Zone>
      )}
      {on("city") && (
        <Zone from={2.2} to={3.9}>
          <NightCity lite={lite} />
        </Zone>
      )}
      {on("galaxy") && (
        <Zone from={3.2} to={4.8}>
          <Galaxy lite={lite} />
        </Zone>
      )}
      {on("road") && (
        <Zone from={4.2} to={6.9}>
          <SunriseRoad />
        </Zone>
      )}

      {on("post") &&
        (!lite ? (
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <N8AO halfRes aoRadius={0.6} intensity={1.5} distanceFalloff={0.6} quality="performance" />
            <Bloom mipmapBlur intensity={0.85} luminanceThreshold={1.15} luminanceSmoothing={0.15} />
            <Noise premultiply opacity={0.06} />
            <Vignette eskil={false} offset={0.22} darkness={0.4} />
          </EffectComposer>
        ) : (
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <Bloom mipmapBlur intensity={0.8} luminanceThreshold={1.15} luminanceSmoothing={0.2} />
          </EffectComposer>
        ))}
    </>
  );
}

export function JourneyCanvas() {
  const startLite =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4 || new URLSearchParams(window.location.search).has("lite"));
  // Drop to the lighter world if this device can't hold a smooth frame rate.
  const [lite, setLite] = useState(startLite);
  return (
    <Canvas
      shadows={!lite}
      dpr={lite ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
      camera={{ fov: 35, near: 0.05, far: 1200, position: [-1.35, 1.32, 5.5] }}
    >
      <PerformanceMonitor onDecline={() => setLite(true)} flipflops={1}>
        <AdaptiveDpr />
        <World lite={lite} />
      </PerformanceMonitor>
    </Canvas>
  );
}
