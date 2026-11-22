import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import * as THREE from "three";
import { journey, LAST, near } from "./store";

const MODEL = "/avatar/yohan.glb";
const CLIPS = {
  idle: "/avatar/anim/idle.fbx",
  greet: "/avatar/anim/greeting.fbx",
  wave: "/avatar/anim/wave.fbx",
};

/**
 * Mixamo clips target "mixamorig:Hips"-style bones in centimetres. The Avaturn rig uses the same
 * bone names without the prefix, in metres. Keep only rotations so the clips sit cleanly on this body.
 */
function retarget(clip: THREE.AnimationClip, name: string) {
  const tracks = clip.tracks
    .filter((t) => t.name.endsWith(".quaternion"))
    .map((t) => {
      const c = t.clone();
      c.name = c.name.replace(/^mixamorig:?/, "");
      return c;
    });
  return new THREE.AnimationClip(name, clip.duration, tracks);
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
  const { scene } = useGLTF(MODEL);
  const [idleFbx, greetFbx, waveFbx] = useLoader(FBXLoader, [CLIPS.idle, CLIPS.greet, CLIPS.wave]);

  const bones = useMemo(() => {
    scene.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (m.isMesh) {
        m.castShadow = true;
        m.receiveShadow = true;
        m.frustumCulled = false;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat && "roughness" in mat) {
          mat.envMapIntensity = 0.85;
          mat.roughness = Math.max(mat.roughness, 0.55);
          mat.metalness = 0;
        }
      }
    });
    const get = (n: string) => scene.getObjectByName(n) ?? null;
    return { head: get("Head"), neck: get("Neck"), spine: get("Spine2") };
  }, [scene]);

  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const actions = useMemo(() => {
    const idle = mixer.clipAction(retarget(idleFbx.animations[0], "idle"));
    const greet = mixer.clipAction(retarget(greetFbx.animations[0], "greet"));
    const wave = mixer.clipAction(retarget(waveFbx.animations[0], "wave"));
    greet.setLoop(THREE.LoopOnce, 1);
    greet.clampWhenFinished = true;
    wave.setLoop(THREE.LoopRepeat, Infinity);
    return { idle, greet, wave };
  }, [mixer, idleFbx, greetFbx, waveFbx]);

  const state = useRef<"greet" | "idle" | "wave">("greet");

  useEffect(() => {
    const { idle, greet } = actions;
    // Say hello once, then settle into a natural idle.
    state.current = "greet";
    greet.reset().fadeIn(0.4).play();
    const onDone = (e: { action: THREE.AnimationAction }) => {
      if (e.action === greet && state.current === "greet") {
        state.current = "idle";
        idle.reset().fadeIn(0.7).play();
        greet.fadeOut(0.7);
      }
    };
    mixer.addEventListener("finished", onDone as never);
    return () => {
      mixer.removeEventListener("finished", onDone as never);
      mixer.stopAllAction();
    };
  }, [actions, mixer]);

  const look = useRef({ x: 0, y: 0 });

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);

    // Wave when the journey comes home.
    const home = near(LAST, 0.5) > 0.6;
    if (home && state.current === "idle") {
      state.current = "wave";
      actions.wave.reset().fadeIn(0.5).play();
      actions.idle.fadeOut(0.5);
    } else if (!home && state.current === "wave") {
      state.current = "idle";
      actions.idle.reset().fadeIn(0.6).play();
      actions.wave.fadeOut(0.6);
    }
    mixer.update(d);

    // Small, smooth head turns toward the pointer while the visitor is with him.
    const k = 1 - Math.pow(0.004, d);
    const w = Math.max(near(0, 0.6), near(LAST, 0.6)) * (state.current === "idle" ? 1 : 0.4);
    look.current.x += (journey.mouse.x * w - look.current.x) * k;
    look.current.y += (journey.mouse.y * w - look.current.y) * k;
    const { x, y } = look.current;
    if (bones.spine) rotateWorld(bones.spine, Y, x * 0.05);
    if (bones.neck) rotateWorld(bones.neck, Y, x * 0.14);
    if (bones.head) {
      rotateWorld(bones.head, Y, x * 0.18);
      rotateWorld(bones.head, X, -y * 0.08);
    }
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL);
