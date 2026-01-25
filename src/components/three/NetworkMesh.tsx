import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface ParticlesProps {
  count: number;
  mouse: React.MutableRefObject<{ x: number; y: number }>;
  scrollY: number;
}

function Particles({ count, mouse, scrollY }: ParticlesProps) {
  const ref = useRef<THREE.Points>(null);
  const { viewport } = useThree();
  
  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 20;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 10;
      
      // Gradient from violet to cyan
      const t = Math.random();
      colors[i3] = 0.5 + t * 0.3; // R
      colors[i3 + 1] = 0.3 + t * 0.5; // G
      colors[i3 + 2] = 0.9 + t * 0.1; // B
    }
    
    return [positions, colors];
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    
    const time = state.clock.getElapsedTime();
    
    // Slow drift
    ref.current.rotation.x = Math.sin(time * 0.05) * 0.1;
    ref.current.rotation.y = time * 0.02;
    
    // Mouse influence (max 15-20%)
    const targetRotationX = mouse.current.y * 0.15;
    const targetRotationZ = mouse.current.x * 0.15;
    
    ref.current.rotation.x += (targetRotationX - ref.current.rotation.x) * 0.02;
    ref.current.rotation.z += (targetRotationZ - ref.current.rotation.z) * 0.02;
    
    // Scroll parallax
    ref.current.position.y = scrollY * 0.001;
    ref.current.position.z = -2 + scrollY * 0.0005;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        vertexColors
        size={0.08}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.8}
      />
    </Points>
  );
}

function ConnectionLines({ count, scrollY }: { count: number; scrollY: number }) {
  const ref = useRef<THREE.LineSegments>(null);
  
  const geometry = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const maxConnections = Math.min(count / 4, 80);
    
    for (let i = 0; i < maxConnections; i++) {
      // Random line segments
      const x1 = (Math.random() - 0.5) * 15;
      const y1 = (Math.random() - 0.5) * 15;
      const z1 = (Math.random() - 0.5) * 8;
      
      const x2 = x1 + (Math.random() - 0.5) * 4;
      const y2 = y1 + (Math.random() - 0.5) * 4;
      const z2 = z1 + (Math.random() - 0.5) * 2;
      
      positions.push(x1, y1, z1, x2, y2, z2);
      
      // Gradient colors
      const t = Math.random();
      colors.push(
        0.5 + t * 0.2, 0.4, 0.9, // Start: violet
        0.3, 0.7 + t * 0.3, 0.9  // End: cyan
      );
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    return geo;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();
    ref.current.rotation.y = time * 0.015;
    ref.current.position.y = scrollY * 0.0008;
  });

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.15} blending={THREE.AdditiveBlending} />
    </lineSegments>
  );
}

function FloatingPackets({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 20;
      pos[i3 + 1] = (Math.random() - 0.5) * 20;
      pos[i3 + 2] = (Math.random() - 0.5) * 5;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    const time = state.clock.getElapsedTime();
    
    const posArray = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Slow movement along random directions
      posArray[i3] += Math.sin(time * 0.1 + i) * 0.002;
      posArray[i3 + 1] += Math.cos(time * 0.1 + i * 0.5) * 0.001;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions}>
      <PointMaterial
        transparent
        color="#38bdf8"
        size={0.15}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        opacity={0.6}
      />
    </Points>
  );
}

interface NetworkMeshProps {
  scrollY: number;
}

export function NetworkMeshCanvas({ scrollY }: NetworkMeshProps) {
  const mouse = useRef({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const particleCount = isMobile ? 150 : 320;
  const packetCount = isMobile ? 8 : 20;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <fog attach="fog" args={['#0a0a12', 5, 25]} />
        <ambientLight intensity={0.5} />
        <Particles count={particleCount} mouse={mouse} scrollY={scrollY} />
        <ConnectionLines count={particleCount} scrollY={scrollY} />
        <FloatingPackets count={packetCount} />
      </Canvas>
    </div>
  );
}

export default NetworkMeshCanvas;
