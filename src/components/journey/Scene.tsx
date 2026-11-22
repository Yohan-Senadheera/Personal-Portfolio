import { Suspense, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  MeshReflectorMaterial,
  RoundedBox,
  Stars,
} from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, Noise, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { Avatar } from "./Avatar";
import { journey } from "./store";

/* =================================================================== world map
   0 studio (you)  ->  1 the rack  ->  fibre tunnel  ->  2 above the clouds (WSO2 platform)
   ->  dive  ->  3 night city (PageRewind)  ->  climb  ->  4 open-source galaxy
   ->  5 dawn road (experience)  ->  6 back to the studio
================================================================================ */

const RACK = new THREE.Vector3(2.6, 0, -4.6);
const TUNNEL = { x: 2.6, y: 1.15, z0: -5.2, z1: -46 };
const SKY = new THREE.Vector3(4.5, 5, -72);
const CITY = new THREE.Vector3(0, -60, -96);
const SPACE = new THREE.Vector3(0, 120, -110);
const ROAD = new THREE.Vector3(-16, 0, -36);

const BLUE = "#3d6bff";
const CYAN = "#46d8ff";
const GREEN = "#22c55e";
const RED = "#ff3b3b";
const AZURE = "#2f8cff";
const AWS = "#ff9a1f";

type V = [number, number, number];
type CamKey = { t: number; pos: V; tgt: V };

// Camera path. Integer t = a chapter where the camera holds; fractions are waypoints in the flights between.
const CAM: CamKey[] = [
  { t: 0, pos: [-1.35, 1.32, 5.5], tgt: [-1.35, 1.0, 0] },
  { t: 1, pos: [2.6, 1.3, -1.15], tgt: [2.6, 1.55, -4.6] },
  { t: 1.3, pos: [2.6, 1.17, -3.6], tgt: [2.6, 1.15, -12] },
  { t: 1.5, pos: [2.6, 1.15, -14], tgt: [2.6, 1.15, -30] },
  { t: 1.75, pos: [2.6, 1.5, -40], tgt: [3.5, 4, -60] },
  { t: 2, pos: [-8.5, 9.5, -54], tgt: [-1.2, 4.0, -73] },
  { t: 2.45, pos: [1, 2, -80], tgt: [1, -40, -86] },
  { t: 2.7, pos: [6, -26, -78], tgt: [2, -50, -96] },
  { t: 3, pos: [17, -33, -69], tgt: [5.5, -46, -96] },
  { t: 3.5, pos: [2, -30, -96], tgt: [0, 60, -104] },
  { t: 3.75, pos: [0, 95, -100], tgt: [0, 130, -112] },
  { t: 4, pos: [-6.5, 122, -97.5], tgt: [-2.4, 120, -110] },
  { t: 4.5, pos: [-10, 40, -70], tgt: [-16, 2, -40] },
  { t: 5, pos: [-9.2, 4.6, -55], tgt: [-18.6, 0.8, -36] },
  { t: 5.55, pos: [-14, 2.2, -12], tgt: [-4, 1.2, 0] },
  { t: 5.8, pos: [-6, 1.6, 5], tgt: [0, 1.1, 0] },
  { t: 6, pos: [-1.2, 1.3, 4.9], tgt: [-1.2, 1.05, 0] },
];

// Mood: background / fog / light along the journey.
type Mood = { t: number; bg: string; near: number; far: number; light: number };
const MOOD: Mood[] = [
  { t: 0, bg: "#efece6", near: 12, far: 42, light: 1 },
  { t: 1, bg: "#e8e5df", near: 9, far: 34, light: 0.9 },
  { t: 1.32, bg: "#05070d", near: 6, far: 40, light: 0.25 },
  { t: 1.7, bg: "#05070d", near: 6, far: 40, light: 0.25 },
  { t: 1.9, bg: "#bfd8f2", near: 45, far: 190, light: 1 },
  { t: 2.2, bg: "#bfd8f2", near: 45, far: 190, light: 1 },
  { t: 2.6, bg: "#0a1022", near: 14, far: 80, light: 0.35 },
  { t: 3.2, bg: "#070b18", near: 18, far: 85, light: 0.3 },
  { t: 3.6, bg: "#03040b", near: 200, far: 600, light: 0.35 },
  { t: 4.3, bg: "#03040b", near: 200, far: 600, light: 0.35 },
  { t: 4.75, bg: "#efcdb3", near: 22, far: 110, light: 0.85 },
  { t: 5.3, bg: "#efcdb3", near: 22, far: 110, light: 0.85 },
  { t: 6, bg: "#efece6", near: 12, far: 42, light: 1 },
];

const smooth = (x: number) => x * x * (3 - 2 * x);
const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);

function segment<T extends { t: number }>(keys: T[], t: number) {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1].t) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const f = THREE.MathUtils.clamp((t - a.t) / (b.t - a.t), 0, 1);
  return { a, b, f };
}

/* =================================================================== textures (generated, no downloads) */

function canvasTexture(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  draw(cv.getContext("2d")!);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const glowTexture = () =>
  canvasTexture(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });

const cloudTexture = () =>
  canvasTexture(256, 256, (c) => {
    for (let i = 0; i < 26; i++) {
      const x = 128 + (Math.random() - 0.5) * 120;
      const y = 140 + (Math.random() - 0.5) * 70;
      const r = 40 + Math.random() * 60;
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,0.42)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g;
      c.fillRect(0, 0, 256, 256);
    }
  });

const windowTexture = () => {
  const t = canvasTexture(64, 128, (c) => {
    c.fillStyle = "#000";
    c.fillRect(0, 0, 64, 128);
    for (let y = 4; y < 124; y += 6) {
      for (let x = 3; x < 61; x += 6) {
        const r = Math.random();
        if (r < 0.32) {
          c.fillStyle = r < 0.06 ? "#9fd2ff" : r < 0.2 ? "#ffd59a" : "#ffb86b";
          c.globalAlpha = 0.55 + Math.random() * 0.45;
          c.fillRect(x, y, 3, 3);
        }
      }
    }
    c.globalAlpha = 1;
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;
  return t;
};

/* =================================================================== shared bits */

function useVisible(ref: React.RefObject<THREE.Object3D>, from: number, to: number) {
  useFrame(() => {
    if (ref.current) ref.current.visible = journey.t > from && journey.t < to;
  });
}

function Tag({
  position,
  show,
  children,
  tone = "ink",
}: {
  position: V | THREE.Vector3;
  show: [number, number];
  children: ReactNode;
  tone?: "ink" | "blue" | "green" | "red" | "dark";
}) {
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

const glowMat = (hex: string, k = 2.4) =>
  new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), toneMapped: false });

/* =================================================================== mood + camera */

function Director() {
  const { scene, camera, size } = useThree();
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const ca = useMemo(() => new THREE.Color(), []);
  const cb = useMemo(() => new THREE.Color(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const pa = useMemo(() => new THREE.Vector3(), []);
  const pb = useMemo(() => new THREE.Vector3(), []);
  const look = useRef(new THREE.Vector3(-1.35, 1.0, 0));

  useMemo(() => {
    scene.background = new THREE.Color(MOOD[0].bg);
    scene.fog = new THREE.Fog(MOOD[0].bg, MOOD[0].near, MOOD[0].far);
  }, [scene]);

  useFrame((state, dt) => {
    const t = THREE.MathUtils.clamp(journey.t, 0, 6);

    // mood
    const m = segment(MOOD, t);
    const f = smooth(m.f);
    const bg = scene.background as THREE.Color;
    bg.copy(ca.set(m.a.bg)).lerp(cb.set(m.b.bg), f);
    const fog = scene.fog as THREE.Fog;
    fog.color.copy(bg);
    fog.near = THREE.MathUtils.lerp(m.a.near, m.b.near, f);
    fog.far = THREE.MathUtils.lerp(m.a.far, m.b.far, f);
    const light = THREE.MathUtils.lerp(m.a.light, m.b.light, f);
    if (hemi.current) hemi.current.intensity = 0.75 * light;
    if (key.current) key.current.intensity = 1.8 * light;

    // camera
    const portrait = size.width / size.height < 0.9;
    const c = segment(CAM, t);
    const whole = Number.isInteger(c.a.t) && Number.isInteger(c.b.t);
    const e = whole ? smoother(c.f) : smooth(c.f);
    pos.lerpVectors(pa.set(...c.a.pos), pb.set(...c.b.pos), e);
    tgt.lerpVectors(pa.set(...c.a.tgt), pb.set(...c.b.tgt), e);
    if (portrait) {
      // phones: pull back and centre on the subject
      pa.copy(pos).sub(tgt).multiplyScalar(0.45);
      pos.add(pa);
      if (t < 0.5 || t > 5.6) {
        pos.x = 0;
        tgt.x = 0;
        tgt.y += 1.15;
      } else tgt.y += 0.9;
    }
    const el = state.clock.elapsedTime;
    pos.x += journey.mouse.x * 0.14 + Math.sin(el * 0.33) * 0.03;
    pos.y += journey.mouse.y * 0.08 + Math.cos(el * 0.29) * 0.025;

    const k = journey.calm ? 1 : 1 - Math.exp(-Math.min(dt, 0.05) * 3.4);
    camera.position.lerp(pos, k);
    look.current.lerp(tgt, k);
    camera.lookAt(look.current);
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#ffffff", "#cfc6b8", 0.75]} />
      <directionalLight
        ref={key}
        position={[4, 7, 6]}
        intensity={2.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-1}
      />
    </>
  );
}

/* =================================================================== 0 · studio */

function Studio({ lite }: { lite: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (g.current) g.current.visible = journey.t < 1.4 || journey.t > 5.2;
  });
  return (
    <group ref={g}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -4]} receiveShadow>
        <circleGeometry args={[30, 96]} />
        {lite ? (
          <meshStandardMaterial color="#e9e5dd" roughness={0.9} />
        ) : (
          <MeshReflectorMaterial
            resolution={1024}
            blur={[400, 120]}
            mixBlur={1}
            mixStrength={0.9}
            mirror={0.35}
            roughness={0.85}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#e7e2d9"
            metalness={0.1}
          />
        )}
      </mesh>
      <mesh position={[0, 0.07, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.85, 0.9, 0.14, 96]} />
        <meshPhysicalMaterial color="#f7f4ee" roughness={0.3} clearcoat={0.6} clearcoatRoughness={0.2} />
      </mesh>
      <mesh position={[0, 0.141, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 0.84, 96]} />
        <primitive object={glowMat(BLUE, 1.6)} attach="material" />
      </mesh>
      <Suspense fallback={null}>
        <Avatar position={[0, 0.14, 0]} />
      </Suspense>
      <ContactShadows position={[0, 0.145, 0]} opacity={0.55} scale={2.2} blur={2.2} far={1.6} resolution={512} color="#3b352c" />
      {[-7, 7].map((x) => (
        <mesh key={x} position={[x, 3.4, -9]} rotation={[0, x < 0 ? 0.5 : -0.5, 0]}>
          <planeGeometry args={[3.2, 5.6]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* =================================================================== 1 · the rack (and the portal) */

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
      c.set(Math.random() < 0.7 ? GREEN : Math.random() < 0.5 ? CYAN : BLUE).multiplyScalar(2.2);
      c.toArray(arr, i * 3);
    }
    return arr;
  }, [N]);
  const phase = useMemo(() => Array.from({ length: N }, () => Math.random() * 10), [N]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (g.current) g.current.visible = journey.t < 1.45 || journey.t > 5.4;
    if (leds.current) {
      for (let i = 0; i < N; i++) {
        const row = Math.floor(i / 12);
        const col = i % 12;
        const on = Math.sin(t * (2 + (i % 5)) + phase[i]) > -0.2 ? 1 : 0.15;
        dummy.position.set(-0.42 + col * 0.03, 0.32 + row * 0.19, 0.505);
        dummy.scale.setScalar(on);
        dummy.updateMatrix();
        leds.current.setMatrixAt(i, dummy.matrix);
      }
      leds.current.instanceMatrix.needsUpdate = true;
    }
    const open = THREE.MathUtils.clamp((journey.t - 0.85) / 0.4, 0, 1);
    if (portal.current) {
      (portal.current.material as THREE.MeshBasicMaterial).opacity = open * 0.95;
      portal.current.scale.set(1, 0.2 + open * 0.8, 1);
    }
    if (door.current) door.current.rotation.y = -open * 1.9;
  });

  return (
    <group ref={g} position={RACK}>
      <RoundedBox args={[1.25, 2.3, 1.0]} radius={0.03} smoothness={3} position={[0, 1.15, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#16181d" metalness={0.75} roughness={0.32} />
      </RoundedBox>
      {Array.from({ length: 10 }, (_, i) => (
        <group key={i} position={[0, 0.32 + i * 0.19, 0.48]}>
          <mesh>
            <boxGeometry args={[1.08, 0.15, 0.04]} />
            <meshStandardMaterial color="#23262d" metalness={0.8} roughness={0.35} />
          </mesh>
          <mesh position={[0.32, 0, 0.022]}>
            <boxGeometry args={[0.36, 0.09, 0.005]} />
            <meshStandardMaterial color="#0c0d10" metalness={0.4} roughness={0.6} />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={leds} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry args={[0.012, 0.012, 0.006]}>
          <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </boxGeometry>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
      <mesh ref={portal} position={[0, 1.15, 0.47]}>
        <planeGeometry args={[1.08, 2.0]} />
        <meshBasicMaterial color={new THREE.Color(CYAN).multiplyScalar(2.6)} transparent opacity={0} toneMapped={false} />
      </mesh>
      <group ref={door} position={[-0.6, 1.15, 0.53]}>
        <mesh position={[0.6, 0, 0]}>
          <boxGeometry args={[1.2, 2.2, 0.02]} />
          <meshPhysicalMaterial color="#9fb5c8" roughness={0.08} transparent opacity={0.3} metalness={0.2} />
        </mesh>
      </group>
      <mesh position={[0, 2.31, 0.3]}>
        <boxGeometry args={[1.1, 0.012, 0.02]} />
        <primitive object={glowMat(CYAN, 2)} attach="material" />
      </mesh>
      <Tag position={[0, 2.75, 0.3]} show={[1, 0.5]} tone="dark">
        <b>prod-rack-01</b>
        <span>keep scrolling to step inside</span>
      </Tag>
    </group>
  );
}

/* =================================================================== fibre tunnel */

function FibreTunnel() {
  const g = useRef<THREE.Group>(null);
  const streaks = useRef<THREE.InstancedMesh>(null);
  const N = 900;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(
    () =>
      Array.from({ length: N }, () => ({
        a: Math.random() * Math.PI * 2,
        r: 0.9 + Math.random() * 1.6,
        z: Math.random(),
        len: 0.6 + Math.random() * 2.6,
        speed: 0.25 + Math.random() * 0.5,
      })),
    [],
  );
  const colors = useMemo(() => {
    const arr = new Float32Array(N * 3);
    const c = new THREE.Color();
    const pal = [CYAN, BLUE, "#ffffff", GREEN, "#8a7dff"];
    for (let i = 0; i < N; i++) {
      c.set(pal[i % pal.length]).multiplyScalar(1.6 + Math.random() * 1.6);
      c.toArray(arr, i * 3);
    }
    return arr;
  }, []);
  const rings = useRef<THREE.Group>(null);
  const L = TUNNEL.z0 - TUNNEL.z1;

  useFrame((s) => {
    const vis = journey.t > 1.05 && journey.t < 1.95;
    if (g.current) g.current.visible = vis;
    if (!vis || !streaks.current) return;
    const t = s.clock.elapsedTime;
    data.forEach((d, i) => {
      const z = TUNNEL.z0 - ((d.z + t * d.speed * 0.08) % 1) * L;
      dummy.position.set(TUNNEL.x + Math.cos(d.a) * d.r, TUNNEL.y + Math.sin(d.a) * d.r, z);
      dummy.scale.set(1, 1, d.len);
      dummy.updateMatrix();
      streaks.current!.setMatrixAt(i, dummy.matrix);
    });
    streaks.current.instanceMatrix.needsUpdate = true;
    if (rings.current) rings.current.rotation.z = t * 0.2;
  });

  return (
    <group ref={g}>
      <instancedMesh ref={streaks} args={[undefined, undefined, N]} frustumCulled={false}>
        <boxGeometry args={[0.012, 0.012, 1]}>
          <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </boxGeometry>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </instancedMesh>
      <group ref={rings} position={[TUNNEL.x, TUNNEL.y, 0]}>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} position={[0, 0, TUNNEL.z0 - 3 - i * 4]}>
            <torusGeometry args={[2.7, 0.012, 6, 90]} />
            <primitive object={glowMat(i % 3 === 0 ? GREEN : BLUE, 1.6)} attach="material" />
          </mesh>
        ))}
      </group>
      <Tag position={[TUNNEL.x, TUNNEL.y + 0.55, -22]} show={[1.5, 0.18]} tone="dark">
        <b>mTLS · NATS bus</b>
        <span>riding the fibre to the cloud</span>
      </Tag>
    </group>
  );
}

/* =================================================================== sky + clouds */

const SKY_VERT = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const SKY_FRAG = /* glsl */ `
  uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform vec3 sunDir; uniform vec3 sunColor;
  varying vec3 vDir;
  void main() {
    float h = vDir.y;
    vec3 col = h > 0.0 ? mix(horizon, top, pow(smoothstep(0.0, 0.75, h), 0.8)) : mix(horizon, bottom, smoothstep(0.0, -0.35, h));
    float sun = max(dot(normalize(vDir), normalize(sunDir)), 0.0);
    col += sunColor * (pow(sun, 600.0) * 1.2 + pow(sun, 12.0) * 0.25);
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** A soft gradient sky (above the clouds, and the dawn road). Kept below bloom threshold so it never washes the scene. */
function SkyDome() {
  const ref = useRef<THREE.Mesh>(null);
  const { camera } = useThree();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: SKY_VERT,
        fragmentShader: SKY_FRAG,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
        uniforms: {
          top: { value: new THREE.Color("#2b5fbf") },
          horizon: { value: new THREE.Color("#bfd8f2") },
          bottom: { value: new THREE.Color("#5f86c4") },
          sunDir: { value: new THREE.Vector3(0.4, 0.5, -1) },
          sunColor: { value: new THREE.Color("#fff3d6") },
        },
      }),
    [],
  );
  useFrame(() => {
    if (!ref.current) return;
    const t = journey.t;
    ref.current.visible = (t > 1.7 && t < 2.6) || (t > 4.55 && t < 5.75);
    ref.current.position.copy(camera.position);
    const dawn = t > 3.5;
    const u = mat.uniforms;
    u.top.value.set(dawn ? "#7f9bd0" : "#2b5fbf");
    u.horizon.value.set(dawn ? "#f4c6a2" : "#bfd8f2");
    u.bottom.value.set(dawn ? "#e8cbb4" : "#5f86c4");
    u.sunDir.value.set(dawn ? -0.6 : 0.4, dawn ? 0.04 : 0.5, -1);
    u.sunColor.value.set(dawn ? "#ffd2a0" : "#fff3d6");
  });
  return (
    <mesh ref={ref} material={mat} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[300, 48, 24]} />
    </mesh>
  );
}

function CloudSea() {
  const tex = useMemo(cloudTexture, []);
  const g = useRef<THREE.Group>(null);
  const puffs = useMemo(
    () =>
      Array.from({ length: 70 }, () => ({
        x: SKY.x + (Math.random() - 0.5) * 120,
        y: -3 + Math.random() * 3.5,
        z: SKY.z + (Math.random() - 0.5) * 90 - 6,
        s: 10 + Math.random() * 16,
        r: Math.random() * Math.PI,
      })),
    [],
  );
  useFrame((s) => {
    if (g.current) {
      g.current.visible = journey.t > 1.6 && journey.t < 2.9;
      g.current.position.x = Math.sin(s.clock.elapsedTime * 0.05) * 2;
    }
  });
  return (
    <group ref={g}>
      {puffs.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} rotation={[-Math.PI / 2, 0, p.r]}>
          <planeGeometry args={[p.s, p.s]} />
          <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.9} color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

/* =================================================================== 2 · above the clouds: the WSO2 platform */

function Packets({
  from,
  to,
  color,
  count = 5,
  speed = 0.35,
  stopAt = 1,
  lift = 1.4,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  count?: number;
  speed?: number;
  stopAt?: number;
  lift?: number;
}) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const curve = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, lift, 0));
    return new THREE.QuadraticBezierCurve3(from, mid, to);
  }, [from, to, lift]);
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 48, 0.014, 6, false), [curve]);
  const mat = useMemo(() => glowMat(color, 2.6), [color]);
  useFrame((s) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (s.clock.elapsedTime * speed + i / count) % 1;
      const p = Math.min(u, stopAt);
      curve.getPoint(p, m.position);
      const fade = u > stopAt ? 0 : Math.sin(Math.PI * (p / stopAt));
      m.scale.setScalar(0.001 + fade);
    });
  });
  return (
    <group>
      <mesh geometry={tube}>
        <meshBasicMaterial color={color} transparent opacity={0.35} toneMapped={false} />
      </mesh>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} material={mat}>
          <sphereGeometry args={[0.1, 16, 16]} />
        </mesh>
      ))}
    </group>
  );
}

function Island({ at, label, sub, tint, planned }: { at: THREE.Vector3; label: string; sub: string; tint: string; planned?: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (g.current) g.current.position.y = at.y + Math.sin(s.clock.elapsedTime * 0.6 + at.x) * 0.12;
  });
  return (
    <group ref={g} position={at}>
      <mesh position={[0, -0.85, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[1.55, 1.6, 7, 1]} />
        <meshStandardMaterial color={planned ? "#c9ced8" : "#8f8a80"} roughness={0.95} flatShading transparent opacity={planned ? 0.35 : 1} />
      </mesh>
      <RoundedBox args={[3, 0.3, 3]} radius={0.12} smoothness={3} castShadow receiveShadow>
        <meshPhysicalMaterial color="#f6f7fa" roughness={0.25} clearcoat={0.6} transparent opacity={planned ? 0.35 : 1} />
      </RoundedBox>
      {!planned && (
        <>
          {[-0.8, 0, 0.8].map((x) =>
            [-0.6, 0.6].map((z) => (
              <group key={`${x}${z}`} position={[x, 0.36, z]}>
                <mesh castShadow>
                  <boxGeometry args={[0.5, 0.42, 0.5]} />
                  <meshStandardMaterial color="#20232a" metalness={0.7} roughness={0.3} />
                </mesh>
                <mesh position={[0, 0.06, 0.252]}>
                  <boxGeometry args={[0.3, 0.02, 0.002]} />
                  <primitive object={glowMat(tint, 2)} attach="material" />
                </mesh>
              </group>
            )),
          )}
          <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.05, 0.025, 8, 6]} />
            <primitive object={glowMat(GREEN, 1.8)} attach="material" />
          </mesh>
        </>
      )}
      <mesh position={[0, 0.16, 1.51]}>
        <boxGeometry args={[2.6, 0.04, 0.005]} />
        <primitive object={glowMat(tint, 2.2)} attach="material" />
      </mesh>
      <Tag position={[0, 1.5, 0]} show={[2, 0.45]}>
        <b>{label}</b>
        <span>{sub}</span>
      </Tag>
    </group>
  );
}

function SkyPlatform() {
  const g = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);
  const certs = useRef<THREE.Group>(null);
  useVisible(g, 1.6, 2.75);
  const cp = SKY;
  const aks = useMemo(() => cp.clone().add(new THREE.Vector3(-7, -1.6, 4)), [cp]);
  const eks = useMemo(() => cp.clone().add(new THREE.Vector3(7, -1.6, 4)), [cp]);
  const onprem = useMemo(() => cp.clone().add(new THREE.Vector3(0, -2.2, 9)), [cp]);
  const core = useMemo(() => cp.clone().add(new THREE.Vector3(0, 0.5, 0)), [cp]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (ring.current) ring.current.rotation.z = t * 0.25;
    if (certs.current) certs.current.rotation.y = t * 0.2;
  });
  return (
    <group ref={g}>
      <group position={cp}>
        <mesh position={[0, -1.2, 0]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[2.3, 2.4, 8, 1]} />
          <meshStandardMaterial color="#8f8a80" roughness={0.95} flatShading />
        </mesh>
        <RoundedBox args={[4.2, 0.35, 3.2]} radius={0.15} smoothness={3} castShadow receiveShadow>
          <meshPhysicalMaterial color="#ffffff" roughness={0.18} clearcoat={0.8} />
        </RoundedBox>
        <RoundedBox args={[3.4, 1.3, 2.2]} radius={0.18} smoothness={4} position={[0, 0.85, 0]}>
          <meshPhysicalMaterial color="#e8f0ff" transmission={0.92} thickness={0.8} roughness={0.08} ior={1.4} />
        </RoundedBox>
        {["Workflows", "Events", "CD", "ESO"].map((n, i) => (
          <mesh key={n} position={[-1.1 + i * 0.73, 0.7, 0]} castShadow>
            <boxGeometry args={[0.46, 0.7, 1.2]} />
            {i === 3 ? <primitive object={glowMat(BLUE, 1.5)} attach="material" /> : <meshStandardMaterial color="#1b1e25" metalness={0.7} roughness={0.25} />}
          </mesh>
        ))}
        <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.4, 0]}>
          <torusGeometry args={[3.2, 0.035, 10, 140]} />
          <primitive object={glowMat(BLUE, 1.7)} attach="material" />
        </mesh>
        <group ref={certs} position={[0, 0.5, 0]}>
          {Array.from({ length: 22 }, (_, i) => {
            const a = (i / 22) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 4.1, Math.sin(i * 1.7) * 0.3, Math.sin(a) * 4.1]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.16, 0.16, 0.035, 6]} />
                <primitive object={glowMat(GREEN, 1.5)} attach="material" />
              </mesh>
            );
          })}
        </group>
        <Tag position={[0, 2.3, 0]} show={[2, 0.45]} tone="blue">
          <b>Control plane</b>
          <span>Argo Workflows · Events · CD · ESO</span>
        </Tag>
        <Tag position={[4.6, 1.2, 0]} show={[2, 0.45]} tone="green">
          <b>20+ services</b>
          <span>CA-signed certs · auto-rotated · prod</span>
        </Tag>
      </group>

      <Island at={aks} label="AKS data plane" sub="Azure" tint={AZURE} />
      <Island at={eks} label="EKS data plane" sub="AWS" tint={AWS} />
      <Island at={onprem} label="On-prem" sub="planned" tint="#9aa1ad" planned />

      <Packets from={aks.clone().add(new THREE.Vector3(0, 0.6, 0))} to={core} color={CYAN} lift={2} />
      <Packets from={eks.clone().add(new THREE.Vector3(0, 0.6, 0))} to={core} color={CYAN} speed={0.3} lift={2} />
      <Packets from={aks.clone().add(new THREE.Vector3(-5, 2.5, 6))} to={aks.clone().add(new THREE.Vector3(-1.3, 0.6, 1.3))} color={RED} count={2} speed={0.26} stopAt={0.96} lift={0.6} />
      <Packets from={eks.clone().add(new THREE.Vector3(5, 2.5, 6))} to={eks.clone().add(new THREE.Vector3(1.3, 0.6, 1.3))} color={RED} count={2} speed={0.22} stopAt={0.96} lift={0.6} />
      <Tag position={[cp.x, cp.y - 1.2, cp.z + 6.5]} show={[2, 0.45]} tone="green">
        <b>0 inbound</b>
        <span>data planes dial out over mTLS · attacks stop at the shield</span>
      </Tag>
    </group>
  );
}

/* =================================================================== 3 · night city: PageRewind */

function NightCity() {
  const g = useRef<THREE.Group>(null);
  useVisible(g, 2.35, 3.7);
  const win = useMemo(windowTexture, []);
  const glow = useMemo(glowTexture, []);
  const blocks = useMemo(() => {
    const out: { x: number; z: number; w: number; d: number; h: number }[] = [];
    for (let i = -7; i <= 7; i++)
      for (let j = -7; j <= 7; j++) {
        if (i === 0 && j === 0) continue;
        if (Math.random() < 0.12) continue;
        const dist = Math.hypot(i, j);
        const h = 2 + Math.random() * 7 + Math.max(0, 6 - dist) * 1.4;
        out.push({ x: i * 4 + (Math.random() - 0.5), z: j * 4 + (Math.random() - 0.5), w: 2 + Math.random() * 1.2, d: 2 + Math.random() * 1.2, h });
      }
    return out;
  }, []);
  const city = useRef<THREE.InstancedMesh>(null);
  const roofs = useMemo(() => blocks.map((b) => new THREE.Vector3(CITY.x + b.x, CITY.y + b.h, CITY.z + b.z)), [blocks]);
  const tower = useMemo(() => new THREE.Vector3(CITY.x, CITY.y + 16, CITY.z), []);
  const phone = useMemo(() => new THREE.Vector3(CITY.x - 8, CITY.y + 15, CITY.z + 7), []);

  const placed = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const alerts = useRef<THREE.InstancedMesh>(null);
  const NA = 100;
  const seeds = useMemo(() => Array.from({ length: NA }, (_, i) => ({ roof: (i * 7) % roofs.length, d: Math.random(), s: 0.7 + Math.random() * 0.6 })), [roofs.length]);
  const orb = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Sprite>(null);
  const beam = useRef<THREE.Mesh>(null);
  const ack = useRef<THREE.Mesh>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const beamGeo = useMemo(() => {
    const dir = phone.clone().sub(tower);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(0.04, 0.04, len, 8, 1, true);
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
      });
      city.current.instanceMatrix.needsUpdate = true;
      placed.current = true;
    }
    if (!g.current?.visible) return;
    if (alerts.current) {
      seeds.forEach((sd, i) => {
        const u = (t * 0.18 * sd.s + sd.d) % 1;
        tmp.lerpVectors(roofs[sd.roof], tower, smooth(u));
        tmp.y += Math.sin(Math.PI * u) * 6;
        dummy.position.copy(tmp);
        dummy.scale.setScalar(0.17 * (1 - u * 0.55));
        dummy.updateMatrix();
        alerts.current!.setMatrixAt(i, dummy.matrix);
      });
      alerts.current.instanceMatrix.needsUpdate = true;
    }
    const pulse = 1 + Math.sin(t * 3.2) * 0.08;
    if (orb.current) orb.current.scale.setScalar(0.75 * pulse);
    if (halo.current) halo.current.scale.setScalar(7 + Math.sin(t * 3.2) * 0.8);
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
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color="#0b0f1a" roughness={0.6} metalness={0.3} />
      </mesh>
      {Array.from({ length: 8 }, (_, i) => (
        <group key={i}>
          <mesh position={[CITY.x + (i - 3.5) * 8 + 2, CITY.y + 0.02, CITY.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.12, 64]} />
            <primitive object={glowMat("#ffb36b", 1.3)} attach="material" />
          </mesh>
          <mesh position={[CITY.x, CITY.y + 0.02, CITY.z + (i - 3.5) * 8 + 2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
            <planeGeometry args={[0.12, 64]} />
            <primitive object={glowMat("#6bb8ff", 1.1)} attach="material" />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={city} args={[undefined, undefined, blocks.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#141a28" roughness={0.45} metalness={0.5} emissive="#ffffff" emissiveMap={win} emissiveIntensity={1.4} />
      </instancedMesh>
      <mesh position={[CITY.x, CITY.y + 7.5, CITY.z]}>
        <boxGeometry args={[2.4, 15, 2.4]} />
        <meshStandardMaterial color="#10141f" metalness={0.6} roughness={0.35} emissive="#ffffff" emissiveMap={win} emissiveIntensity={0.9} />
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
        <RoundedBox args={[1.5, 2.9, 0.14]} radius={0.16} smoothness={4}>
          <meshStandardMaterial color="#0d0f14" metalness={0.8} roughness={0.25} />
        </RoundedBox>
        <mesh position={[0, 0, 0.075]}>
          <planeGeometry args={[1.32, 2.68]} />
          <meshBasicMaterial color={new THREE.Color("#1a2440").multiplyScalar(1.6)} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.55, 0.08]}>
          <planeGeometry args={[1.1, 0.42]} />
          <primitive object={glowMat(RED, 1.3)} attach="material" />
        </mesh>
        <mesh ref={ack} position={[0, -0.5, 0.09]}>
          <ringGeometry args={[0.32, 0.36, 48]} />
          <meshBasicMaterial color={new THREE.Color(GREEN).multiplyScalar(2.2)} transparent toneMapped={false} />
        </mesh>
      </group>
      <Tag position={[phone.x, phone.y + 2.1, phone.z]} show={[3, 0.45]} tone="red">
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

function Galaxy() {
  const g = useRef<THREE.Group>(null);
  useVisible(g, 3.35, 4.7);
  const glow = useMemo(glowTexture, []);
  const orbit = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const cards = useMemo(
    () =>
      Array.from({ length: 17 }, (_, i) => ({
        kind: i < 4 ? "merged" : i < 15 ? "review" : "issue",
        a: (i / 17) * Math.PI * 2 + (i % 2) * 0.18,
        r: i % 2 ? 6.2 : 4.6,
        y: Math.sin(i * 2.1) * 0.9,
      })),
    [],
  );
  const nebula: [string, number, number, number, number][] = [
    ["#3d6bff", -14, 4, -18, 40],
    ["#8a3dff", 12, -6, -22, 46],
    ["#16c2a3", 2, 10, -30, 36],
    ["#ff5ea8", -20, -10, -26, 30],
  ];
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (orbit.current) orbit.current.rotation.y = t * 0.12;
    if (core.current) core.current.rotation.y = t * 0.3;
  });
  return (
    <group ref={g}>
      <group position={SPACE}>
        <Stars radius={60} depth={50} count={3500} factor={3.2} saturation={0.4} fade speed={0.6} />
        {nebula.map(([c, x, y, z, s], i) => (
          <sprite key={i} position={[x, y, z]} scale={[s, s, 1]}>
            <spriteMaterial map={glow} color={c} transparent opacity={0.22} depthWrite={false} blending={THREE.AdditiveBlending} />
          </sprite>
        ))}
        <mesh ref={core}>
          <icosahedronGeometry args={[1.3, 2]} />
          <meshStandardMaterial color="#0e1220" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[1.55, 1]} />
          <meshBasicMaterial color={new THREE.Color(CYAN).multiplyScalar(1.8)} wireframe toneMapped={false} />
        </mesh>
        <sprite scale={[9, 9, 1]}>
          <spriteMaterial map={glow} color={CYAN} transparent opacity={0.4} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
        <group ref={orbit} rotation={[0.25, 0, 0.12]}>
          {cards.map((c, i) => {
            const col = c.kind === "merged" ? GREEN : c.kind === "review" ? BLUE : "#8b93a3";
            return (
              <group key={i} position={[Math.cos(c.a) * c.r, c.y, Math.sin(c.a) * c.r]} rotation={[0, -c.a + Math.PI / 2, 0]}>
                <RoundedBox args={c.kind === "merged" ? [1.3, 0.82, 0.05] : [1.05, 0.66, 0.04]} radius={0.06} smoothness={2}>
                  <meshPhysicalMaterial color="#e9eefc" roughness={0.15} metalness={0.1} transparent opacity={0.9} />
                </RoundedBox>
                <mesh position={[-0.22, 0.14, 0.04]}>
                  <boxGeometry args={[0.5, 0.06, 0.005]} />
                  <primitive object={glowMat(col, c.kind === "merged" ? 2.6 : 1.5)} attach="material" />
                </mesh>
                <mesh position={[0, -0.08, 0.04]}>
                  <boxGeometry args={[0.75, 0.03, 0.005]} />
                  <meshBasicMaterial color="#aab3c8" />
                </mesh>
                {c.kind === "merged" && (
                  <sprite scale={[2.2, 2.2, 1]}>
                    <spriteMaterial map={glow} color={GREEN} transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} />
                  </sprite>
                )}
              </group>
            );
          })}
        </group>
        <Tag position={[0, 2.8, 0]} show={[4, 0.45]} tone="green">
          <b>4 merged · 11 in review · 2 issues</b>
          <span>Argo · Kubernetes · Prometheus · WSO2 · OpenChoreo</span>
        </Tag>
      </group>
    </group>
  );
}

/* =================================================================== 5 · dawn road: experience */

const MILESTONES = [
  { label: "2022", sub: "Computer Engineering · Peradeniya" },
  { label: "2024", sub: "Teaching assistant · 40+ students" },
  { label: "2025", sub: "P-E-BO · ICIIS 3rd place" },
  { label: "2026", sub: "SRE Intern · WSO2" },
  { label: "Now", sub: "PageRewind live · open to roles" },
];

function DawnRoad() {
  const g = useRef<THREE.Group>(null);
  useVisible(g, 4.4, 5.9);
  const dash = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (dash.current) dash.current.position.z = ((s.clock.elapsedTime * 1.2) % 2) - 1;
  });
  const z0 = ROAD.z - 18;
  return (
    <group ref={g}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROAD.x, -0.02, ROAD.z]} receiveShadow>
        <planeGeometry args={[80, 90]} />
        <meshStandardMaterial color="#c9b29c" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[ROAD.x, 0.0, ROAD.z]} receiveShadow>
        <planeGeometry args={[3.2, 70]} />
        <meshStandardMaterial color="#2a2c31" roughness={0.75} />
      </mesh>
      <group ref={dash}>
        {Array.from({ length: 34 }, (_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[ROAD.x, 0.01, ROAD.z - 34 + i * 2]}>
            <planeGeometry args={[0.1, 0.9]} />
            <meshBasicMaterial color="#f4efe6" />
          </mesh>
        ))}
      </group>
      {MILESTONES.map((m, i) => {
        const z = z0 + i * 7.5;
        const x = ROAD.x + (i % 2 ? 2.6 : -2.6);
        const last = i === MILESTONES.length - 1;
        const h = 2.4 + i * 0.35;
        return (
          <group key={m.label} position={[x, 0, z]}>
            <RoundedBox args={[0.9, h, 0.3]} radius={0.06} smoothness={3} position={[0, h / 2, 0]} castShadow>
              <meshPhysicalMaterial color={last ? "#ffffff" : "#f5f1ea"} roughness={0.35} clearcoat={0.4} />
            </RoundedBox>
            <mesh position={[0, h - 0.15, 0.16]}>
              <boxGeometry args={[0.6, 0.05, 0.005]} />
              <primitive object={glowMat(last ? GREEN : BLUE, 2)} attach="material" />
            </mesh>
            <Tag position={[0, h + 0.7, 0]} show={[5, 0.45]} tone={last ? "green" : "ink"}>
              <b>{m.label}</b>
              <span>{m.sub}</span>
            </Tag>
          </group>
        );
      })}
    </group>
  );
}

/* =================================================================== world */

function World({ lite }: { lite: boolean }) {
  return (
    <>
      <Director />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 2]} scale={[12, 4, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} position={[-6, 2, 3]} scale={[4, 7, 1]} rotation-y={Math.PI / 3} />
        <Lightformer form="rect" intensity={1.4} position={[6, 2, 3]} scale={[4, 7, 1]} rotation-y={-Math.PI / 3} color="#e3ebff" />
        <Lightformer form="ring" intensity={2} position={[0, 2, -6]} scale={3} color="#fff4e6" />
      </Environment>
      <pointLight position={[-0.8, 1.8, 2.2]} intensity={1.6} distance={6} color="#fff1e0" />

      <Studio lite={lite} />
      <Rack />
      <FibreTunnel />
      <SkyDome />
      <CloudSea />
      <SkyPlatform />
      <NightCity />
      <Galaxy />
      <DawnRoad />

      {!lite ? (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <N8AO halfRes aoRadius={0.6} intensity={1.6} distanceFalloff={0.6} quality="performance" />
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={1.15} luminanceSmoothing={0.15} />
          <Noise premultiply opacity={0.08} />
          <Vignette eskil={false} offset={0.22} darkness={0.42} />
        </EffectComposer>
      ) : (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom mipmapBlur intensity={0.8} luminanceThreshold={1.15} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}
    </>
  );
}

export function JourneyCanvas() {
  const lite = typeof window !== "undefined" && (window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4);
  return (
    <Canvas
      shadows={!lite}
      dpr={lite ? [1, 1.5] : [1, 1.75]}
      gl={{ antialias: false, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      camera={{ fov: 35, near: 0.05, far: 900, position: [-1.35, 1.32, 5.5] }}
    >
      <World lite={lite} />
    </Canvas>
  );
}
