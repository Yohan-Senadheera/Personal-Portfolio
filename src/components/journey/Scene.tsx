import { Suspense, useMemo, useRef, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ContactShadows,
  Environment,
  Grid,
  Html,
  Lightformer,
  Line,
  RoundedBox,
  Sparkles,
} from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { Avatar } from "./Avatar";
import { journey, near } from "./store";

/* ------------------------------------------------------------------ palette */

export const C = {
  bg: "#f3f1ec",
  ink: "#12151b",
  paper: "#ffffff",
  stone: "#e4e1d9",
  blue: "#2f5bff",
  green: "#12a150",
  red: "#ef4444",
  amber: "#f59e0b",
};

const glow = (hex: string, k = 2.2) => new THREE.Color(hex).multiplyScalar(k);

/* ------------------------------------------------------------------ zones */

const Z_GLANCE = new THREE.Vector3(0, 3.3, -13);
const Z_PLATFORM = new THREE.Vector3(13, 1, -24);
const Z_ALERTS = new THREE.Vector3(-12, 1, -37);
const Z_OSS = new THREE.Vector3(0, 2.4, -52);
const Z_PATH = new THREE.Vector3(10, 2, -64);

type Key = { pos: [number, number, number]; tgt: [number, number, number]; center: THREE.Vector3 };

// Desktop camera keyframes, one per chapter. Text sits on one side, the scene on the other.
const KEYS: Key[] = [
  { pos: [-1.25, 1.3, 5.6], tgt: [-1.25, 1.0, 0], center: new THREE.Vector3(0, 1.0, 0) },
  { pos: [0, 3.9, -3.8], tgt: [0, 3.0, -13], center: Z_GLANCE },
  { pos: [3.2, 9.6, -8.6], tgt: [10.4, 0.2, -23.4], center: Z_PLATFORM },
  { pos: [-4.6, 4.4, -26.2], tgt: [-7.8, 2.7, -37], center: Z_ALERTS.clone().add(new THREE.Vector3(0, 1.5, 0)) },
  { pos: [-2.6, 3.3, -44.2], tgt: [-1.7, 2.4, -52], center: Z_OSS },
  { pos: [3.4, 5.2, -53.0], tgt: [11.6, 1.6, -64], center: Z_PATH },
  { pos: [-1.15, 1.3, 4.8], tgt: [-1.15, 1.05, 0], center: new THREE.Vector3(0, 1.05, 0) },
];

const smoother = (x: number) => x * x * x * (x * (x * 6 - 15) + 10);
const v3 = (a: [number, number, number]) => new THREE.Vector3(...a);

function keyFor(i: number, portrait: boolean) {
  const k = KEYS[i];
  const pos = v3(k.pos);
  const tgt = v3(k.tgt);
  if (!portrait) return { pos, tgt };
  // Phones: centre the subject, pull back, and lift the target so the scene sits under the text.
  const dir = pos.clone().sub(k.center);
  const p = k.center.clone().add(dir.multiplyScalar(i === 0 || i === 6 ? 1.45 : 1.55));
  const t = k.center.clone().add(new THREE.Vector3(0, i === 0 || i === 6 ? 1.6 : 1.4, 0));
  return { pos: p, tgt: t };
}

function CameraRig() {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(-1.25, 1.0, 0));
  const pos = useRef(new THREE.Vector3());
  const tgt = useRef(new THREE.Vector3());

  useFrame((state, dt) => {
    const portrait = size.width / size.height < 0.9;
    const t = THREE.MathUtils.clamp(journey.t, 0, KEYS.length - 1);
    const i = Math.min(Math.floor(t), KEYS.length - 2);
    const f = smoother(t - i);
    const a = keyFor(i, portrait);
    const b = keyFor(i + 1, portrait);
    pos.current.lerpVectors(a.pos, b.pos, f);
    tgt.current.lerpVectors(a.tgt, b.tgt, f);
    // Arc between chapters; a big lift on the long flight home.
    const arc = Math.sin(Math.PI * f) * (i === 5 ? 9 : 1.4);
    pos.current.y += arc;

    // Gentle hand-held drift + pointer parallax.
    const el = state.clock.elapsedTime;
    pos.current.x += journey.mouse.x * 0.18 + Math.sin(el * 0.35) * 0.04;
    pos.current.y += journey.mouse.y * 0.1 + Math.cos(el * 0.3) * 0.03;

    const k = journey.calm ? 1 : 1 - Math.exp(-Math.min(dt, 0.05) * 3.2);
    camera.position.lerp(pos.current, k);
    look.current.lerp(tgt.current, k);
    camera.lookAt(look.current);
  });
  return null;
}

/* ------------------------------------------------------------------ helpers */

function Tag({
  position,
  chapter,
  children,
  tone = "ink",
}: {
  position: [number, number, number];
  chapter: number;
  children: ReactNode;
  tone?: "ink" | "blue" | "green" | "red" | "muted";
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    const o = near(chapter, 0.6);
    if (ref.current) {
      ref.current.style.opacity = o.toFixed(3);
      ref.current.style.transform = `translateY(${((1 - o) * 10).toFixed(1)}px)`;
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

const white = new THREE.MeshStandardMaterial({ color: C.paper, roughness: 0.38, metalness: 0.02 });

/* ------------------------------------------------------------------ cover backdrop: the work, softly */

function CoverBackdrop() {
  const group = useRef<THREE.Group>(null);
  const { size } = useThree();
  const portrait = size.width / size.height < 0.9;
  const ring = useRef<THREE.Mesh>(null);
  const nodes = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        x: (i % 4) * 0.9 - 1.35,
        y: Math.floor(i / 4) * 0.9 + 1.0,
        lit: [1, 6, 9].includes(i),
        phase: i * 0.7,
      })),
    [],
  );
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (ring.current) ring.current.rotation.z = t * 0.12;
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.15) * 0.08;
      const v = portrait ? 0 : near(0, 0.9);
      const sc = 0.001 + v;
      group.current.scale.setScalar(sc);
      group.current.visible = v > 0.01;
    }
    refs.current.forEach((m, i) => {
      if (m) m.position.y = nodes[i].y + Math.sin(t * 0.8 + nodes[i].phase) * 0.06;
    });
  });
  return (
    <group position={[3.4, 0, -9]} ref={group}>
      {/* a small cluster */}
      {nodes.map((n, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={[n.x, n.y, 0]}
          material={n.lit ? undefined : white}
          castShadow
        >
          <boxGeometry args={[0.62, 0.62, 0.62]} />
          {n.lit && <meshBasicMaterial color={glow(C.blue, 1.6)} toneMapped={false} />}
        </mesh>
      ))}
      {/* the bus */}
      <mesh ref={ring} position={[0, 1.9, -1.2]}>
        <torusGeometry args={[2.6, 0.025, 16, 160]} />
        <meshBasicMaterial color={glow(C.blue, 1.3)} toneMapped={false} />
      </mesh>
      {/* certificates */}
      {[-2.6, 2.4].map((x, i) => (
        <Float key={i} position={[x, 2.8 - i * 1.3, -0.4]} speed={0.6 + i * 0.2}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.42, 0.06, 6]} />
            <meshStandardMaterial color={C.paper} roughness={0.3} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.035]}>
            <torusGeometry args={[0.36, 0.022, 8, 6]} />
            <meshBasicMaterial color={glow(C.green, 1.8)} toneMapped={false} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Float({
  children,
  position,
  speed = 1,
}: {
  children: ReactNode;
  position: [number, number, number];
  speed?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime * speed;
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t) * 0.12;
      ref.current.rotation.y = Math.sin(t * 0.7) * 0.4;
    }
  });
  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ chapter 1: at a glance */

function GlanceZone() {
  const cols = useRef<(THREE.Group | null)[]>([]);
  const heights = [2.0, 1.7, 1.2, 2.2];
  const xs = [-2.82, -0.94, 0.94, 2.82];
  const tones = [C.green, C.blue, C.ink, C.blue];
  useFrame((s) => {
    const o = near(1, 1.1);
    const t = s.clock.elapsedTime;
    cols.current.forEach((g, i) => {
      if (!g) return;
      const h = 0.001 + o * heights[i];
      g.scale.y += (h - g.scale.y) * 0.08;
      g.visible = g.scale.y > 0.02;
      g.position.y = Z_GLANCE.y - 2.2 + Math.sin(t * 0.6 + i) * 0.03;
    });
  });
  return (
    <group>
      {heights.map((_, i) => (
        <group
          key={i}
          ref={(el) => (cols.current[i] = el)}
          position={[Z_GLANCE.x + xs[i], Z_GLANCE.y - 2.2, Z_GLANCE.z]}
          scale={[1, 0.001, 1]}
        >
          <mesh position={[0, 0.5, 0]} material={white}>
            <boxGeometry args={[1.0, 1, 0.4]} />
          </mesh>
          <mesh position={[0, 0.5, 0.21]}>
            <boxGeometry args={[0.05, 0.98, 0.01]} />
            <meshBasicMaterial color={glow(tones[i], tones[i] === C.ink ? 1 : 2)} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <Sparkles
        position={[Z_GLANCE.x, Z_GLANCE.y, Z_GLANCE.z]}
        count={40}
        scale={[9, 4, 3]}
        size={3}
        speed={0.3}
        color={C.blue}
        opacity={0.6}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ chapter 2: pull-based platform */

function Packets({
  from,
  to,
  color,
  count = 5,
  speed = 0.35,
  chapter,
  stopAt = 1,
}: {
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: string;
  count?: number;
  speed?: number;
  chapter: number;
  stopAt?: number;
}) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const curve = useMemo(() => {
    const mid = from.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 0.9, 0));
    return new THREE.QuadraticBezierCurve3(from, mid, to);
  }, [from, to]);
  useFrame((s) => {
    const on = near(chapter, 0.9);
    refs.current.forEach((m, i) => {
      if (!m) return;
      const u = (s.clock.elapsedTime * speed + i / count) % 1;
      const p = Math.min(u, stopAt);
      curve.getPoint(p, m.position);
      const fade = u > stopAt ? 0 : Math.sin(Math.PI * (p / stopAt));
      m.scale.setScalar(0.001 + fade * on);
    });
  });
  return (
    <group>
      <Line points={curve.getPoints(40)} color={color} lineWidth={1.2} transparent opacity={0.35} />
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshBasicMaterial color={glow(color, 2.4)} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function DataPlane({ at, label, sub, planned }: { at: THREE.Vector3; label: string; sub: string; planned?: boolean }) {
  return (
    <group position={at}>
      <RoundedBox args={[2.1, 0.5, 1.5]} radius={0.12} smoothness={4} position={[0, 0.25, 0]}>
        {planned ? (
          <meshStandardMaterial color={C.paper} transparent opacity={0.35} />
        ) : (
          <meshStandardMaterial color={C.paper} roughness={0.35} />
        )}
      </RoundedBox>
      {!planned &&
        [-0.55, 0, 0.55].map((x) => (
          <mesh key={x} position={[x, 0.72, 0]} material={white} castShadow>
            <boxGeometry args={[0.38, 0.38, 0.38]} />
          </mesh>
        ))}
      {/* the shield: nothing gets in */}
      {!planned && (
        <mesh position={[0, 0.6, 0.95]}>
          <torusGeometry args={[0.55, 0.02, 8, 6]} />
          <meshBasicMaterial color={glow(C.green, 1.8)} toneMapped={false} />
        </mesh>
      )}
      <Tag position={[0, 1.45, 0]} chapter={2} tone={planned ? "muted" : "ink"}>
        <b>{label}</b>
        <span>{sub}</span>
      </Tag>
    </group>
  );
}

function PlatformZone() {
  const ring = useRef<THREE.Mesh>(null);
  const certs = useRef<THREE.Group>(null);
  const cp = Z_PLATFORM;
  const aks = useMemo(() => cp.clone().add(new THREE.Vector3(-5, -0.4, 2.6)), [cp]);
  const eks = useMemo(() => cp.clone().add(new THREE.Vector3(5, -0.4, 2.6)), [cp]);
  const onprem = useMemo(() => cp.clone().add(new THREE.Vector3(0, -0.4, 6)), [cp]);
  const core = useMemo(() => cp.clone().add(new THREE.Vector3(0, 0.7, 0)), [cp]);
  const outsideA = useMemo(() => aks.clone().add(new THREE.Vector3(-2.5, 1.5, 5)), [aks]);
  const outsideE = useMemo(() => eks.clone().add(new THREE.Vector3(2.5, 1.5, 5)), [eks]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (ring.current) ring.current.rotation.z = t * 0.25;
    if (certs.current) certs.current.rotation.y = t * 0.22;
  });

  return (
    <group>
      {/* control plane */}
      <group position={cp}>
        <RoundedBox args={[3, 0.7, 2]} radius={0.14} smoothness={4} position={[0, 0.35, 0]} castShadow>
          <meshStandardMaterial color={C.paper} roughness={0.3} />
        </RoundedBox>
        {[-1, -0.33, 0.33, 1].map((x, i) => (
          <mesh key={x} position={[x, 0.95, 0]} castShadow>
            <boxGeometry args={[0.52, 0.5, 1.2]} />
            {i === 3 ? (
              <meshBasicMaterial color={glow(C.blue, 1.5)} toneMapped={false} />
            ) : (
              <meshStandardMaterial color={C.paper} roughness={0.3} />
            )}
          </mesh>
        ))}
        <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.55, 0]}>
          <torusGeometry args={[2.5, 0.03, 12, 120]} />
          <meshBasicMaterial color={glow(C.blue, 1.6)} toneMapped={false} />
        </mesh>
        {/* 20+ services on automated certificates */}
        <group ref={certs} position={[0, 0.55, 0]}>
          {Array.from({ length: 22 }, (_, i) => {
            const a = (i / 22) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 3.4, Math.sin(i * 1.7) * 0.25, Math.sin(a) * 3.4]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.13, 0.13, 0.03, 6]} />
                <meshBasicMaterial color={glow(C.green, 1.4)} toneMapped={false} />
              </mesh>
            );
          })}
        </group>
        <Tag position={[0, 2.1, 0]} chapter={2} tone="blue">
          <b>Control plane</b>
          <span>Argo Workflows · Events · CD · ESO</span>
        </Tag>
        <Tag position={[3.6, 1.2, 0]} chapter={2} tone="green">
          <b>20+ services</b>
          <span>CA-signed certs, auto-rotated</span>
        </Tag>
      </group>

      <DataPlane at={aks} label="AKS data plane" sub="Azure" />
      <DataPlane at={eks} label="EKS data plane" sub="AWS" />
      <DataPlane at={onprem} label="On-prem" sub="planned" planned />

      {/* dial-out over mTLS: data planes connect out to the control plane */}
      <Packets from={aks.clone().add(new THREE.Vector3(0, 0.6, 0))} to={core} color={C.blue} chapter={2} />
      <Packets from={eks.clone().add(new THREE.Vector3(0, 0.6, 0))} to={core} color={C.blue} chapter={2} speed={0.3} />
      {/* inbound attempts stop at the shield */}
      <Packets from={outsideA} to={aks.clone().add(new THREE.Vector3(0, 0.6, 0.95))} color={C.red} count={2} chapter={2} speed={0.28} stopAt={0.97} />
      <Packets from={outsideE} to={eks.clone().add(new THREE.Vector3(0, 0.6, 0.95))} color={C.red} count={2} chapter={2} speed={0.24} stopAt={0.97} />
      <Tag position={[cp.x, cp.y + 1.6, cp.z + 4.4]} chapter={2} tone="green">
        <b>0 inbound</b>
        <span>every data plane dials out over mTLS</span>
      </Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ chapter 3: PageRewind */

function AlertStorm() {
  const N = 100;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const orb = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () => Array.from({ length: N }, () => ({ a: Math.random() * Math.PI * 2, r: 1.2 + Math.random() * 2.4, d: Math.random(), s: 0.6 + Math.random() * 0.6 })),
    [],
  );
  const c = Z_ALERTS;
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const on = near(3, 0.9);
    if (mesh.current) {
      seeds.forEach((sd, i) => {
        const u = (t * 0.22 * sd.s + sd.d) % 1; // 0 top → 1 merged
        const r = sd.r * (1 - u) * (1 - u);
        const ang = sd.a + u * 4;
        dummy.position.set(c.x + Math.cos(ang) * r, c.y + 0.9 + (1 - u) * 5.2, c.z + Math.sin(ang) * r);
        dummy.scale.setScalar((0.035 + 0.045 * (1 - u)) * on);
        dummy.updateMatrix();
        mesh.current!.setMatrixAt(i, dummy.matrix);
      });
      mesh.current.instanceMatrix.needsUpdate = true;
    }
    const pulse = 1 + Math.sin(t * 3) * 0.06;
    if (orb.current) orb.current.scale.setScalar(0.36 * pulse * (0.2 + 0.8 * on));
    if (halo.current) {
      const p = (t * 0.6) % 1;
      halo.current.scale.setScalar(0.4 + p * 1.8);
      (halo.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.5 * on;
    }
  });
  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, N]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={glow(C.red, 2)} toneMapped={false} />
      </instancedMesh>
      {/* the funnel */}
      <mesh position={[c.x, c.y + 2.6, c.z]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[2.6, 2.4, 48, 1, true]} />
        <meshStandardMaterial color={C.paper} transparent opacity={0.28} side={THREE.DoubleSide} roughness={0.2} />
      </mesh>
      {/* one incident */}
      <mesh ref={orb} name="incident-orb" position={[c.x, c.y + 0.9, c.z]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={glow(C.red, 2.6)} toneMapped={false} />
      </mesh>
      <mesh ref={halo} position={[c.x, c.y + 0.9, c.z]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1, 64]} />
        <meshBasicMaterial color={C.red} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* the pager */}
      <group position={[c.x + 2.0, c.y + 0.9, c.z + 1.8]} rotation={[0, -0.35, 0]}>
        <RoundedBox args={[0.8, 1.55, 0.1]} radius={0.09} smoothness={4}>
          <meshStandardMaterial color={C.ink} roughness={0.25} metalness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0, 0.055]}>
          <planeGeometry args={[0.7, 1.4]} />
          <meshBasicMaterial color="#1b2230" />
        </mesh>
      </group>
      <Tag position={[c.x + 2.7, c.y + 2.2, c.z + 1.9]} chapter={3} tone="red">
        <b>Incident opened</b>
        <span>on-call paged · Telegram</span>
      </Tag>
      <Tag position={[c.x + 2.4, c.y + 5.2, c.z]} chapter={3} tone="red">
        <b>100 alerts</b>
      </Tag>
      <Tag position={[c.x, c.y + 0.15, c.z + 0.6]} chapter={3} tone="ink">
        <b>1 incident</b>
      </Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ chapter 4: open source */

function OpenSource() {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  // 4 merged, 11 in review, 2 issues
  const cards = useMemo(
    () =>
      Array.from({ length: 17 }, (_, i) => ({
        kind: i < 4 ? "merged" : i < 15 ? "review" : "issue",
        ring: i % 2,
        a: (i / 17) * Math.PI * 2,
      })),
    [],
  );
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (group.current) group.current.rotation.y = t * 0.16;
    if (core.current) {
      core.current.rotation.x = t * 0.2;
      core.current.rotation.y = t * 0.3;
    }
  });
  const c = Z_OSS;
  return (
    <group position={c}>
      <mesh ref={core}>
        <icosahedronGeometry args={[0.95, 1]} />
        <meshStandardMaterial color={C.paper} roughness={0.25} flatShading />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.15, 1]} />
        <meshBasicMaterial color={glow(C.blue, 1.4)} wireframe toneMapped={false} />
      </mesh>
      <group ref={group}>
        {cards.map((cd, i) => {
          const r = cd.ring ? 3.6 : 2.6;
          const y = cd.ring ? 0.55 : -0.45;
          const col = cd.kind === "merged" ? C.green : cd.kind === "review" ? C.blue : "#9aa1ad";
          return (
            <group key={i} position={[Math.cos(cd.a) * r, y, Math.sin(cd.a) * r]} rotation={[0, -cd.a + Math.PI / 2, 0]}>
              <RoundedBox args={cd.kind === "merged" ? [0.9, 0.58, 0.04] : [0.72, 0.46, 0.03]} radius={0.04} smoothness={2}>
                <meshStandardMaterial color={C.paper} roughness={0.35} />
              </RoundedBox>
              <mesh position={[-0.2, 0.08, 0.03]}>
                <boxGeometry args={[0.32, 0.04, 0.005]} />
                <meshBasicMaterial color={glow(col, cd.kind === "merged" ? 2.2 : 1.2)} toneMapped={false} />
              </mesh>
              <mesh position={[0, -0.07, 0.03]}>
                <boxGeometry args={[0.5, 0.025, 0.005]} />
                <meshBasicMaterial color="#c9ccd2" />
              </mesh>
            </group>
          );
        })}
      </group>
      <Tag position={[0, 2.0, 0]} chapter={4} tone="green">
        <b>4 merged · 11 in review</b>
        <span>Argo · Kubernetes · Prometheus · WSO2 · OpenChoreo</span>
      </Tag>
    </group>
  );
}

/* ------------------------------------------------------------------ chapter 5: the path so far */

const MILESTONES = [
  { label: "2022", sub: "Computer Engineering, Peradeniya" },
  { label: "2024", sub: "Teaching assistant · 40+ students" },
  { label: "2025", sub: "P-E-BO · ICIIS 3rd place" },
  { label: "2026", sub: "SRE Intern · WSO2" },
  { label: "Now", sub: "PageRewind live · open to roles" },
];

function PathZone() {
  const c = Z_PATH;
  const pts = useMemo(
    () => MILESTONES.map((_, i) => new THREE.Vector3(c.x - 4 + i * 2, c.y - 0.6 + i * 0.35, c.z + 2.2 - i * 1.1)),
    [c],
  );
  const dot = useRef<THREE.Mesh>(null);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(pts), [pts]);
  useFrame((s) => {
    if (dot.current) curve.getPoint((s.clock.elapsedTime * 0.12) % 1, dot.current.position);
  });
  return (
    <group>
      <Line points={curve.getPoints(80)} color={C.ink} lineWidth={1.5} transparent opacity={0.5} />
      {pts.map((p, i) => (
        <group key={i} position={p}>
          <mesh castShadow>
            <sphereGeometry args={[i === pts.length - 1 ? 0.22 : 0.15, 24, 24]} />
            {i === pts.length - 1 ? (
              <meshBasicMaterial color={glow(C.green, 2)} toneMapped={false} />
            ) : (
              <meshStandardMaterial color={C.paper} roughness={0.3} />
            )}
          </mesh>
          <mesh position={[0, -(p.y - 0.01), 0]}>
            <cylinderGeometry args={[0.008, 0.008, (p.y - 0.01) * 2, 6]} />
            <meshBasicMaterial color="#b9b5ab" />
          </mesh>
          <Tag position={[0, 0.62, 0]} chapter={5} tone={i === pts.length - 1 ? "green" : "ink"}>
            <b>{MILESTONES[i].label}</b>
            <span>{MILESTONES[i].sub}</span>
          </Tag>
        </group>
      ))}
      <mesh ref={dot}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={glow(C.blue, 2.4)} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ world */

function World({ lite }: { lite: boolean }) {
  return (
    <>
      <color attach="background" args={[C.bg]} />
      <fog attach="fog" args={[C.bg, 9, 34]} />

      <hemisphereLight args={["#ffffff", "#d8d2c6", 0.9]} />
      <directionalLight
        position={[3, 6, 5]}
        intensity={1.7}
        castShadow={!lite}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-1}
      />
      {/* soft frontal fill for the face */}
      <pointLight position={[-0.6, 1.7, 2.2]} intensity={2.2} distance={6} color="#fff4e8" />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, 2]} scale={[10, 3, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} position={[-5, 1, 3]} scale={[3, 6, 1]} rotation-y={Math.PI / 3} />
        <Lightformer form="rect" intensity={1.2} position={[5, 1, 3]} scale={[3, 6, 1]} rotation-y={-Math.PI / 3} color="#dfe7ff" />
      </Environment>

      <Grid
        position={[0, 0.001, -30]}
        args={[200, 200]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#dcd8cf"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#cfcabe"
        fadeDistance={38}
        fadeStrength={1.6}
        infiniteGrid
        followCamera={false}
      />

      <Suspense fallback={null}>
        <Avatar position={[0, 0, 0]} />
      </Suspense>
      <ContactShadows position={[0, 0.002, 0]} opacity={0.45} scale={4} blur={2.4} far={2} resolution={512} color="#4a4438" />

      <CoverBackdrop />
      <GlanceZone />
      <PlatformZone />
      <AlertStorm />
      <OpenSource />
      <PathZone />

      <Sparkles count={lite ? 60 : 160} scale={[60, 8, 80]} position={[0, 3, -30]} size={2} speed={0.2} color="#9aa7c7" opacity={0.5} />

      <CameraRig />

      {!lite && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.95} luminanceSmoothing={0.2} />
          <Vignette eskil={false} offset={0.25} darkness={0.35} />
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
      dpr={lite ? [1, 1.5] : [1, 1.8]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 34, near: 0.05, far: 120, position: [-1.25, 1.3, 5.6] }}
    >
      <World lite={lite} />
    </Canvas>
  );
}

