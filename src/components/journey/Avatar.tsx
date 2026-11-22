import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { journey, near } from "./store";

const URL = "/avatar/yohan.glb";

/** Sculpture finish: warm matte stone with a soft sheen. Keeps the cloth and face normal detail. */
function sculpt(src: THREE.MeshStandardMaterial) {
  return new THREE.MeshPhysicalMaterial({
    color: "#e4dccd",
    roughness: 0.62,
    metalness: 0,
    sheen: 0.6,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color("#ffffff"),
    clearcoat: 0.08,
    clearcoatRoughness: 0.6,
    normalMap: src.normalMap ?? null,
    normalScale: new THREE.Vector2(1.1, 1.1),
    envMapIntensity: 1.0,
  });
}

const _q = new THREE.Quaternion();
const _pw = new THREE.Quaternion();
const _inv = new THREE.Quaternion();
const Y = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);

/** Rotate a bone around a world-space axis, on top of its animated pose. */
function rotateWorld(bone: THREE.Object3D, axis: THREE.Vector3, angle: number) {
  if (!bone.parent || angle === 0) return;
  bone.parent.updateWorldMatrix(true, false);
  bone.parent.getWorldQuaternion(_pw);
  _inv.copy(_pw).invert();
  _q.setFromAxisAngle(axis, angle);
  bone.quaternion.premultiply(_pw).premultiply(_q).premultiply(_inv);
  bone.updateMatrixWorld(true);
}

export function Avatar(props: JSX.IntrinsicElements["group"]) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(URL);
  const { actions } = useAnimations(animations, group);

  const bones = useMemo(() => {
    scene.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.frustumCulled = false;
        const src = m.material as THREE.MeshStandardMaterial;
        if (!(src as unknown as { __sculpt?: boolean }).__sculpt) {
          const mat = sculpt(src);
          (mat as unknown as { __sculpt?: boolean }).__sculpt = true;
          m.material = mat;
        }
      }
    });
    const get = (n: string) => scene.getObjectByName(n) ?? null;
    return { head: get("Head"), neck: get("Neck"), spine: get("Spine2") };
  }, [scene]);

  useEffect(() => {
    const idle = Object.values(actions)[0];
    idle?.reset().fadeIn(0.8).play();
    if (idle) idle.timeScale = 0.85;
    return () => {
      idle?.fadeOut(0.3);
    };
  }, [actions]);

  const look = useRef({ x: 0, y: 0 });

  // Runs after the mixer: small, smooth head and torso turns toward the pointer,
  // and toward the camera when the journey comes home.
  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.004, Math.min(dt, 0.05));
    const home = Math.max(near(0, 0.6), near(6, 0.6));
    const tx = journey.mouse.x * home;
    const ty = journey.mouse.y * home;
    look.current.x += (tx - look.current.x) * k;
    look.current.y += (ty - look.current.y) * k;
    const { x, y } = look.current;
    if (bones.spine) rotateWorld(bones.spine, Y, x * 0.06 - 0.05);
    if (bones.neck) rotateWorld(bones.neck, Y, x * 0.16);
    if (bones.head) {
      rotateWorld(bones.head, Y, x * 0.2);
      rotateWorld(bones.head, X, -y * 0.1);
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(URL);
