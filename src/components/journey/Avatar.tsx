import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { journey, near } from "./store";

const URL = "/avatar/yohan.glb";

const _q = new THREE.Quaternion();
const _pw = new THREE.Quaternion();
const _axis = new THREE.Vector3();

/** Rotate a bone by `angle` around a world-space axis, on top of its animated pose. */
function rotateWorld(bone: THREE.Object3D, axis: THREE.Vector3, angle: number) {
  if (!bone.parent || angle === 0) return;
  bone.parent.updateWorldMatrix(true, false);
  bone.parent.getWorldQuaternion(_pw);
  _q.setFromAxisAngle(_axis.copy(axis).normalize(), angle);
  // local' = parentWorld^-1 * R * parentWorld * local
  const inv = _pw.clone().invert();
  bone.quaternion.premultiply(_pw).premultiply(_q).premultiply(inv);
  bone.updateMatrixWorld(true);
}

const X = new THREE.Vector3(1, 0, 0);
const Y = new THREE.Vector3(0, 1, 0);
const Z = new THREE.Vector3(0, 0, 1);

export function Avatar(props: JSX.IntrinsicElements["group"]) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(URL);
  const { actions } = useAnimations(animations, group);

  const bones = useMemo(() => {
    const get = (n: string) => scene.getObjectByName(n) ?? null;
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.frustumCulled = false;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && "envMapIntensity" in mat) mat.envMapIntensity = 0.9;
      }
    });
    return {
      head: get("Head"),
      neck: get("Neck"),
      spine: get("Spine2"),
      rArm: get("RightArm"),
      rFore: get("RightForeArm"),
      rHand: get("RightHand"),
    };
  }, [scene]);

  useEffect(() => {
    const first = Object.values(actions)[0];
    first?.reset().fadeIn(0.6).play();
    return () => {
      first?.fadeOut(0.3);
    };
  }, [actions]);

  const look = useRef({ x: 0, y: 0 });
  const wave = useRef(0);

  // Runs after useAnimations' mixer update, so these are offsets on the idle pose.
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    const k = 1 - Math.pow(0.002, d);
    look.current.x += (journey.mouse.x - look.current.x) * k;
    look.current.y += (journey.mouse.y - look.current.y) * k;

    // Wave when the journey comes home to the contact chapter.
    const greet = near(6, 0.8);
    wave.current += (greet - wave.current) * k;

    const lx = look.current.x;
    const ly = look.current.y;
    if (bones.neck) rotateWorld(bones.neck, Y, lx * 0.22);
    if (bones.head) {
      rotateWorld(bones.head, Y, lx * 0.28);
      rotateWorld(bones.head, X, -ly * 0.16);
    }
    if (bones.spine) rotateWorld(bones.spine, Y, lx * 0.08);

    const w = wave.current;
    if (w > 0.01 && bones.rArm && bones.rFore) {
      const t = state.clock.elapsedTime;
      // Raise the right arm out to the side and up (character faces +Z, right arm on -X).
      rotateWorld(bones.rArm, Z, -2.35 * w);
      rotateWorld(bones.rArm, X, -0.25 * w);
      // Bend the forearm up and wave it.
      rotateWorld(bones.rFore, Z, (-0.35 + Math.sin(t * 7) * 0.32) * w);
      if (bones.rHand) rotateWorld(bones.rHand, Z, Math.sin(t * 7 + 0.6) * 0.15 * w);
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(URL);
