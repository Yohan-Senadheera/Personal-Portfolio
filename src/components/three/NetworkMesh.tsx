import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial, Line } from "@react-three/drei";
import * as THREE from "three";

// ============================================
// NETWORK ORB - Procedurally Generated Nodes
// ============================================

interface NetworkOrbProps {
  nodeCount: number;
  radius: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  scrollY: number;
  maxScroll: number;
}

const getSectionFactor = (scrollY: number) => {
  if (scrollY < 600) return 0; // Hero
  if (scrollY < 1400) return 0.5; // About / Projects
  return 1; // Skills / Experience+
};

function NetworkOrb({
  nodeCount,
  radius,
  mouse,
  scrollY,
  maxScroll,
}: NetworkOrbProps) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const time = useRef(0);
  const { viewport } = useThree();
  const smoothScroll = useRef(0);
  const hoverStrength = useRef(0);

  // Procedurally generate node positions in a spherical distribution
  const { positions, colors, connections } = useMemo(() => {
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);
    const nodePositions: THREE.Vector3[] = [];

    // Fibonacci sphere distribution for even spacing
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < nodeCount; i++) {
      const y = 1 - (i / (nodeCount - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      // Add some noise for organic feel
      const noise = 0.15;
      const px = (x + (Math.random() - 0.5) * noise) * radius;
      const py = (y + (Math.random() - 0.5) * noise) * radius;
      const pz = (z + (Math.random() - 0.5) * noise) * radius;

      const i3 = i * 3;
      positions[i3] = px;
      positions[i3 + 1] = py;
      positions[i3 + 2] = pz;

      nodePositions.push(new THREE.Vector3(px, py, pz));

      // Color gradient: violet center to cyan edge
      const distFromCenter = Math.sqrt(px * px + py * py + pz * pz) / radius;
      const t = distFromCenter;

      // Violet (0.6, 0.3, 1.0) to Cyan (0.3, 0.9, 1.0)
      colors[i3] = 0.6 - t * 0.3; // R
      colors[i3 + 1] = 0.3 + t * 0.6; // G
      colors[i3 + 2] = 1.0; // B
    }

    // Build connections using k-nearest neighbors
    const connections: [THREE.Vector3, THREE.Vector3][] = [];
    const maxConnections = 3;
    const maxDistance = radius * 0.6;

    for (let i = 0; i < nodeCount; i++) {
      const node = nodePositions[i];
      const distances: { index: number; dist: number }[] = [];

      for (let j = 0; j < nodeCount; j++) {
        if (i !== j) {
          const dist = node.distanceTo(nodePositions[j]);
          if (dist < maxDistance) {
            distances.push({ index: j, dist });
          }
        }
      }

      // Sort by distance and take closest
      distances.sort((a, b) => a.dist - b.dist);
      const neighbors = distances.slice(0, maxConnections);

      for (const neighbor of neighbors) {
        // Avoid duplicate connections
        const exists = connections.some(
          ([a, b]) =>
            (a.equals(node) && b.equals(nodePositions[neighbor.index])) ||
            (b.equals(node) && a.equals(nodePositions[neighbor.index])),
        );
        if (!exists) {
          connections.push([
            node.clone(),
            nodePositions[neighbor.index].clone(),
          ]);
        }
      }
    }

    return { positions, colors, connections };
  }, [nodeCount, radius]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    time.current += delta;
    const sectionFactor = getSectionFactor(scrollY);

    // Smooth scroll tracking
    smoothScroll.current += (scrollY - smoothScroll.current) * 0.08;
    const y = smoothScroll.current;

    // Lock orb a bit to the right
    const targetX = viewport.width * 0.28;
    groupRef.current.position.x +=
      (targetX - groupRef.current.position.x) * 0.02;

    // Auto rotation (base)
    groupRef.current.rotation.y += delta * (0.05 + sectionFactor * 0.12);

    // Mouse parallax (smooth)
    const targetRotationX = mouse.current.y * 0.15;
    const targetRotationZ = mouse.current.x * 0.15;

    groupRef.current.rotation.x +=
      (targetRotationX - groupRef.current.rotation.x) * 0.02;
    groupRef.current.rotation.z +=
      (targetRotationZ - groupRef.current.rotation.z) * 0.02;

    // Hover strength (smooth)
    const targetHover = Math.abs(mouse.current.x) + Math.abs(mouse.current.y);
    hoverStrength.current += (targetHover - hoverStrength.current) * 0.05;

    // Scroll transforms (ONE system only)
    const t = THREE.MathUtils.clamp((y - 100) / (600 - 100), 0, 1);

    groupRef.current.position.z = -2 - t * 2.8;
    groupRef.current.position.y = t * 1.3;

    // Slight scale down with scroll
    const s = 1 - t * 0.08;
    groupRef.current.scale.setScalar(s);

    // Pulse nodes a bit
    if (nodesRef.current) {
      const pulse =
        1 + Math.sin(time.current * 0.5) * (0.015 + sectionFactor * 0.03);
      nodesRef.current.scale.setScalar(pulse);
    }
  });

  // Calculate opacity based on scroll
const scrollOpacity = THREE.MathUtils.clamp(
  1 - scrollY / (maxScroll * 0.35),
  0,
  1,
);

  return (
    <group ref={groupRef}>
      {/* Nodes */}
      <Points ref={nodesRef} positions={positions} colors={colors} stride={3}>
        <PointMaterial
          transparent
          vertexColors
          size={0.12 + hoverStrength.current * 0.02}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={scrollOpacity * (0.9 + hoverStrength.current * 0.3)}
        />
      </Points>

      {/* Connections */}
      {connections.map((connection, i) => (
        <ConnectionLine
          key={i}
          start={connection[0]}
          end={connection[1]}
          opacity={scrollOpacity * 0.3}
          index={i}
          hover={hoverStrength.current}
        />
      ))}

      <DataPackets connections={connections} scrollOpacity={scrollOpacity} />
    </group>
  );
}

// ============================================
// CONNECTION LINES with animated data flow
// ============================================

interface ConnectionLineProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  opacity: number;
  index: number;
  hover: number;
}

function ConnectionLine({
  start,
  end,
  opacity,
  index,
  hover,
}: ConnectionLineProps) {
  const points = useMemo(() => [start, end], [start, end]);

  // Gradient color for line
  const color = useMemo(() => {
    const hue = 0.7 + (index % 10) * 0.02; // Violet to blue range
    return new THREE.Color().setHSL(hue, 0.8, 0.6);
  }, [index]);

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1 + hover * 0.6}
      transparent
      opacity={opacity * (0.7 + hover * 0.6)}
    />
  );
}

// ============================================
// DATA PACKETS - Flowing along connections
// ============================================

interface DataPacketsProps {
  connections: [THREE.Vector3, THREE.Vector3][];
  scrollOpacity: number;
}
function DataPackets({ connections, scrollOpacity }: DataPacketsProps) {
  // ✅ If no connections, render nothing
  if (connections.length === 0) return null;

  const packetCount = Math.min(connections.length, 15);
  const packetsRef = useRef<THREE.Points>(null);
  const progressRef = useRef<Float32Array>(new Float32Array(packetCount));

  // Initialize random progress
  useEffect(() => {
    for (let i = 0; i < packetCount; i++) {
      progressRef.current[i] = Math.random();
    }
  }, [packetCount]);

  const positions = useMemo(
    () => new Float32Array(packetCount * 3),
    [packetCount],
  );

  useFrame((state, delta) => {
    if (!packetsRef.current) return;

    const posArray = packetsRef.current.geometry.attributes.position
      .array as Float32Array;

    const speedBoost = 1 + scrollOpacity * 1.5;

    for (let i = 0; i < packetCount; i++) {
      // Update progress
      progressRef.current[i] += delta * (0.08 + (i % 3) * 0.04) * speedBoost;
      if (progressRef.current[i] > 1) progressRef.current[i] = 0;

      // Get connection for this packet
      const connectionIndex = i % connections.length;
      const [start, end] = connections[connectionIndex];

      // Interpolate position
      const t = progressRef.current[i];
      const i3 = i * 3;
      posArray[i3] = start.x + (end.x - start.x) * t;
      posArray[i3 + 1] = start.y + (end.y - start.y) * t;
      posArray[i3 + 2] = start.z + (end.z - start.z) * t;
    }

    packetsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={packetsRef} positions={positions}>
      <PointMaterial
        transparent
        color="#38bdf8"
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={scrollOpacity * 0.8}
      />
    </Points>
  );
}


// ============================================
// OUTER PARTICLES - Ambient floating particles
// ============================================

interface OuterParticlesProps {
  count: number;
  scrollY: number;
  maxScroll: number;
}

function OuterParticles({ count, scrollY, maxScroll }: OuterParticlesProps) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Distribute in a large sphere around the orb
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 6 + Math.random() * 8;

      pos[i3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();

    // Slow drift
    ref.current.rotation.y = time * 0.01;
    ref.current.rotation.x = Math.sin(time * 0.05) * 0.1;

    // Parallax with scroll
    ref.current.position.y = scrollY * 0.002;
  });

  const scrollOpacity = Math.max(0.1, 1 - scrollY / (maxScroll * 0.5));

  return (
    <Points ref={ref} positions={positions}>
      <PointMaterial
        transparent
        color="#a78bfa"
        size={0.04}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={scrollOpacity * 0.4}
      />
    </Points>
  );
}

// ============================================
// MAIN CANVAS COMPONENT
// ============================================

interface NetworkMeshCanvasProps {
  scrollY: number;
}

export function NetworkMeshCanvas({ scrollY }: NetworkMeshCanvasProps) {
  const mouse = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [maxScroll, setMaxScroll] = useState(3000);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setMaxScroll(document.documentElement.scrollHeight - window.innerHeight);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -1 to 1
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Adjust complexity based on device
  const nodeCount = isMobile ? 80 : 180;
  const outerParticleCount = isMobile ? 30 : 80;
  const orbRadius = isMobile ? 2.5 : 3.5;

  return (
    <div className="fixed inset-0 -z-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 55 }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
      >
        {/* Fog for depth */}
        <fog attach="fog" args={["#0a0a12", 8, 25]} />

        {/* Subtle ambient lighting */}
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={0.5} color="#a78bfa" />
        <pointLight position={[-5, -5, 5]} intensity={0.3} color="#38bdf8" />

        {/* Main Network Orb */}
        <NetworkOrb
          nodeCount={nodeCount}
          radius={orbRadius}
          mouse={mouse}
          scrollY={scrollY}
          maxScroll={maxScroll}
        />

        {/* Outer ambient particles */}
        <OuterParticles
          count={outerParticleCount}
          scrollY={scrollY}
          maxScroll={maxScroll}
        />
      </Canvas>
    </div>
  );
}

export default NetworkMeshCanvas;
