// import React, { useRef, useMemo, useEffect, useState } from "react";
// import { Canvas, useFrame, useThree } from "@react-three/fiber";
// import { Points, PointMaterial } from "@react-three/drei";
// import * as THREE from "three";

// // ============================================
// // NETWORK ORB - Procedurally Generated Nodes
// // ============================================

// interface NetworkOrbProps {
//   nodeCount: number;
//   radius: number;
//   mouse: React.MutableRefObject<{ x: number; y: number }>;
//   scrollY: number;
// }

// function NetworkOrb({ nodeCount, radius, mouse, scrollY }: NetworkOrbProps) {
//   const groupRef = useRef<THREE.Group>(null);
//   const nodesRef = useRef<THREE.Points>(null);

//   const time = useRef(0);
//   const smoothScroll = useRef(0);

//   const { viewport } = useThree();

//   // Scroll fade spec: opacity lerps 1→0 between 100-600px scroll
//   const scrollOpacity = useMemo(() => {
//     const t = THREE.MathUtils.clamp((scrollY - 100) / (600 - 100), 0, 1);
//     return 1 - t;
//   }, [scrollY]);

//   // Procedurally generate node positions + connections
//   const { positions, colors, connections } = useMemo(() => {
//     const positions = new Float32Array(nodeCount * 3);
//     const colors = new Float32Array(nodeCount * 3);
//     const nodePositions: THREE.Vector3[] = [];

//     // Fibonacci-ish distribution (your version), reduced noise for cleaner sphere
//     const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle

//     for (let i = 0; i < nodeCount; i++) {
//       const y = 1 - (i / (nodeCount - 1)) * 2; // 1 -> -1
//       const radiusAtY = Math.sqrt(1 - y * y);
//       const theta = phi * i;

//       const x = Math.cos(theta) * radiusAtY;
//       const z = Math.sin(theta) * radiusAtY;

//       // Less noise = more clean orb
//       const noise = 0.06;

//       const px = (x + (Math.random() - 0.5) * noise) * radius;
//       const py = (y + (Math.random() - 0.5) * noise) * radius;
//       const pz = (z + (Math.random() - 0.5) * noise) * radius;

//       const i3 = i * 3;
//       positions[i3] = px;
//       positions[i3 + 1] = py;
//       positions[i3 + 2] = pz;

//       const v = new THREE.Vector3(px, py, pz);
//       nodePositions.push(v);

//       // Color gradient: violet -> cyan-ish
//       const distFromCenter = v.length() / radius;
//       const t = THREE.MathUtils.clamp(distFromCenter, 0, 1);

//       colors[i3] = 0.6 - t * 0.3; // R
//       colors[i3 + 1] = 0.3 + t * 0.6; // G
//       colors[i3 + 2] = 1.0; // B
//     }

//     // Connections using k-nearest neighbors (3-4)
//     const connections: [THREE.Vector3, THREE.Vector3][] = [];
//     const minConnections = 3;
//     const maxConnections = 4;
//     const maxDistance = radius * 0.65;

//     for (let i = 0; i < nodeCount; i++) {
//       const node = nodePositions[i];
//       const distances: { index: number; dist: number }[] = [];

//       for (let j = 0; j < nodeCount; j++) {
//         if (i === j) continue;
//         const dist = node.distanceTo(nodePositions[j]);
//         if (dist < maxDistance) distances.push({ index: j, dist });
//       }

//       distances.sort((a, b) => a.dist - b.dist);
//       const k = minConnections + (i % (maxConnections - minConnections + 1));
//       const neighbors = distances.slice(0, k);

//       for (const nb of neighbors) {
//         const other = nodePositions[nb.index];

//         // avoid duplicates
//         const exists = connections.some(
//           ([a, b]) =>
//             (a.equals(node) && b.equals(other)) ||
//             (a.equals(other) && b.equals(node)),
//         );
//         if (!exists) connections.push([node.clone(), other.clone()]);
//       }
//     }

//     return { positions, colors, connections };
//   }, [nodeCount, radius]);

//   useFrame((state, delta) => {
//     if (!groupRef.current) return;

//     time.current += delta;

//     // Smooth scroll
//     smoothScroll.current += (scrollY - smoothScroll.current) * 0.08;
//     const y = smoothScroll.current;

//     // Keep orb on right side (responsive)
//     const targetX = viewport.width * 0.28; // tweak 0.22..0.35
//     groupRef.current.position.x +=
//       (targetX - groupRef.current.position.x) * 0.03;

//     // Parallax + fade range 100..600
//     const t = THREE.MathUtils.clamp((y - 100) / (600 - 100), 0, 1);

//     // Parallax motion
//     groupRef.current.position.z = -2 - t * 2.4;
//     groupRef.current.position.y = t * 1.2;

//     // subtle scale down
//     groupRef.current.scale.setScalar(1 - t * 0.08);

//     // Auto rotation
//     groupRef.current.rotation.y += delta * 0.08;

//     // Mouse parallax
//     const targetRotationX = mouse.current.y * 0.15;
//     const targetRotationZ = mouse.current.x * 0.15;

//     groupRef.current.rotation.x +=
//       (targetRotationX - groupRef.current.rotation.x) * 0.04;
//     groupRef.current.rotation.z +=
//       (targetRotationZ - groupRef.current.rotation.z) * 0.04;

//     // Node pulse
//     if (nodesRef.current) {
//       const pulse = 1 + Math.sin(time.current * 0.5) * 0.02;
//       nodesRef.current.scale.setScalar(pulse);
//     }
//   });

//   return (
//     <group ref={groupRef}>
//       {/* Nodes */}
//       <Points ref={nodesRef} positions={positions} colors={colors} stride={3}>

//         <PointMaterial
//           transparent
//           vertexColors
//           size={0.14}
//           sizeAttenuation
//           depthWrite={false}
//           blending={THREE.AdditiveBlending}
//           opacity={scrollOpacity * 0.9}
//         />
//       </Points>

//       {/* Connections (batched + shader pulse) */}
//       <ConnectionSegments
//         connections={connections}
//         opacity={scrollOpacity * 0.55}
//       />

//       {/* Data packets (moving dots) */}
//       <DataPackets connections={connections} scrollOpacity={scrollOpacity} />
//     </group>
//   );
// }

// // ============================================
// // CONNECTIONS - batched LineSegments w/ shader pulse
// // ============================================

// function ConnectionSegments({
//   connections,
//   opacity,
// }: {
//   connections: [THREE.Vector3, THREE.Vector3][];
//   opacity: number;
// }) {
//   const geometry = useMemo(() => {
//     const pos = new Float32Array(connections.length * 2 * 3);

//     for (let i = 0; i < connections.length; i++) {
//       const [a, b] = connections[i];
//       const o = i * 6;

//       pos[o + 0] = a.x;
//       pos[o + 1] = a.y;
//       pos[o + 2] = a.z;

//       pos[o + 3] = b.x;
//       pos[o + 4] = b.y;
//       pos[o + 5] = b.z;
//     }

//     const g = new THREE.BufferGeometry();
//     g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
//     return g;
//   }, [connections]);

//   const material = useMemo(
//     () =>
//       new THREE.ShaderMaterial({
//         transparent: true,
//         depthWrite: false,
//         blending: THREE.AdditiveBlending,
//         uniforms: {
//           uTime: { value: 0 },
//           uOpacity: { value: 1 },
//         },
//         vertexShader: `
//           uniform float uTime;
//           varying float vFlow;
//           void main() {
//             vFlow = uTime + position.x*0.35 + position.y*0.25 + position.z*0.15;
//             gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//           }
//         `,
//         fragmentShader: `
//           precision highp float;
//           uniform float uOpacity;
//           varying float vFlow;
//           void main() {
//             float flow = 0.55 + 0.45 * sin(vFlow);
//             float a = (0.06 + 0.22 * flow) * uOpacity;
//             gl_FragColor = vec4(vec3(1.0), a);
//           }
//         `,
//       }),
//     [],
//   );

//   useFrame(({ clock }) => {
//     material.uniforms.uTime.value = clock.getElapsedTime();
//     material.uniforms.uOpacity.value = opacity;
//   });

//   return <lineSegments geometry={geometry} material={material} />;
// }

// // ============================================
// // DATA PACKETS - Flowing along connections
// // ============================================

// function DataPackets({
//   connections,
//   scrollOpacity,
// }: {
//   connections: [THREE.Vector3, THREE.Vector3][];
//   scrollOpacity: number;
// }) {
//   const packetCount = Math.min(connections.length, 18);
//   const packetsRef = useRef<THREE.Points>(null);
//   const progressRef = useRef<Float32Array>(new Float32Array(packetCount));

//   // Init random progress
//   useEffect(() => {
//     for (let i = 0; i < packetCount; i++)
//       progressRef.current[i] = Math.random();
//   }, [packetCount]);

//   const positions = useMemo(
//     () => new Float32Array(packetCount * 3),
//     [packetCount],
//   );

//   useFrame((state, delta) => {
//     if (!packetsRef.current || connections.length === 0) return;

//     const posArray = packetsRef.current.geometry.attributes.position
//       .array as Float32Array;

//     for (let i = 0; i < packetCount; i++) {
//       // speed variation
//       progressRef.current[i] += delta * (0.14 + (i % 3) * 0.06);
//       if (progressRef.current[i] > 1) progressRef.current[i] = 0;

//       const idx = i % connections.length;
//       const [start, end] = connections[idx];

//       const t = progressRef.current[i];
//       const i3 = i * 3;

//       posArray[i3] = THREE.MathUtils.lerp(start.x, end.x, t);
//       posArray[i3 + 1] = THREE.MathUtils.lerp(start.y, end.y, t);
//       posArray[i3 + 2] = THREE.MathUtils.lerp(start.z, end.z, t);
//     }

//     packetsRef.current.geometry.attributes.position.needsUpdate = true;
//   });

//   return (
//     <Points ref={packetsRef} positions={positions}>
//       <PointMaterial
//         transparent
//         color="#38bdf8"
//         size={0.09}
//         sizeAttenuation
//         depthWrite={false}
//         blending={THREE.AdditiveBlending}
//         opacity={scrollOpacity * 0.85}
//       />
//     </Points>
//   );
// }

// // ============================================
// // OUTER PARTICLES - Ambient floating particles
// // ============================================

// function OuterParticles({
//   count,
//   scrollY,
// }: {
//   count: number;
//   scrollY: number;
// }) {
//   const ref = useRef<THREE.Points>(null);

//   const positions = useMemo(() => {
//     const pos = new Float32Array(count * 3);

//     for (let i = 0; i < count; i++) {
//       const i3 = i * 3;
//       const theta = Math.random() * Math.PI * 2;
//       const phi = Math.acos(2 * Math.random() - 1);
//       const r = 6 + Math.random() * 8;

//       pos[i3] = r * Math.sin(phi) * Math.cos(theta);
//       pos[i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
//       pos[i3 + 2] = r * Math.cos(phi);
//     }

//     return pos;
//   }, [count]);

//   const opacity = useMemo(() => {
//     const t = THREE.MathUtils.clamp((scrollY - 100) / (800 - 100), 0, 1);
//     return 1 - t;
//   }, [scrollY]);

//   useFrame((state) => {
//     if (!ref.current) return;
//     const t = state.clock.getElapsedTime();

//     ref.current.rotation.y = t * 0.01;
//     ref.current.rotation.x = Math.sin(t * 0.05) * 0.1;

//     // tiny parallax with scroll
//     ref.current.position.y = scrollY * 0.0015;
//   });

//   return (
//     <Points ref={ref} positions={positions}>
//       <PointMaterial
//         transparent
//         color="#a78bfa"
//         size={0.04}
//         sizeAttenuation
//         depthWrite={false}
//         blending={THREE.AdditiveBlending}
//         opacity={opacity * 0.35}
//       />
//     </Points>
//   );
// }

// // ============================================
// // MAIN CANVAS COMPONENT
// // ============================================

// interface NetworkMeshCanvasProps {
//   scrollY: number;
// }

// export function NetworkMeshCanvas({ scrollY }: NetworkMeshCanvasProps) {
//   const safeScrollY = Number.isFinite(scrollY) ? scrollY : 0;
//   const mouse = useRef({ x: 0, y: 0 });
//   const [isMobile, setIsMobile] = useState(false);

//   useEffect(() => {
//     const checkMobile = () => setIsMobile(window.innerWidth < 768);
//     checkMobile();
//     window.addEventListener("resize", checkMobile);
//     return () => window.removeEventListener("resize", checkMobile);
//   }, []);

//   useEffect(() => {
//     const handleMouseMove = (e: MouseEvent) => {
//       mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
//       mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
//     };

//     window.addEventListener("mousemove", handleMouseMove, { passive: true });
//     return () => window.removeEventListener("mousemove", handleMouseMove);
//   }, []);

//   // Device-based complexity
//   const nodeCount = isMobile ? 80 : 180;
//   const outerParticleCount = isMobile ? 35 : 90;
//   const orbRadius = isMobile ? 2.6 : 3.5;

//   return (
//     <div className="fixed inset-0 -z-10 pointer-events-none">
//       <Canvas
//         camera={{ position: [0, 0, 8], fov: 55 }}
//         dpr={[1, isMobile ? 1.5 : 2]}
//         gl={{
//           antialias: true,
//           alpha: true,
//           powerPreference: "high-performance",
//         }}
//         style={{ background: "transparent" }}
//       >
//         {/* Fog for depth */}
//         <fog attach="fog" args={["#0a0a12", 8, 25]} />

//         {/* Subtle ambient lighting */}
//         <ambientLight intensity={0.3} />
//         <pointLight position={[5, 5, 5]} intensity={0.5} color="#a78bfa" />
//         <pointLight position={[-5, -5, 5]} intensity={0.3} color="#38bdf8" />

//         {/* Main Network Orb */}
//         <NetworkOrb
//           nodeCount={nodeCount}
//           radius={orbRadius}
//           mouse={mouse}
//           scrollY={safeScrollY}
//         />

//         {/* Outer particles */}
//         <OuterParticles count={outerParticleCount} scrollY={safeScrollY} />
//       </Canvas>
//     </div>
//   );
// }

// export default NetworkMeshCanvas;
