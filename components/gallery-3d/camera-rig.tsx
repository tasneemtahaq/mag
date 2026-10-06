import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { RefObject } from "react";
import { MathUtils, Vector3 } from "three";
import type { PerspectiveCamera } from "three";
import {
  BACK_Z,
  END_FOV,
  HERO_FILL,
  START_FOV,
  TITLE_ANCHOR,
  buildCameraKeys,
  sampleKeys,
  smoothstep,
} from "@/components/gallery-3d/gallery-layout";
import type {
  HeroSizeRef,
  ProgressRef,
} from "@/components/gallery-3d/gallery-layout";

export function CameraRig({
  smoothRef,
  heroSizeRef,
  titleRef,
}: {
  smoothRef: ProgressRef;
  heroSizeRef: HeroSizeRef;
  titleRef: RefObject<HTMLElement | null>;
}) {
  // The path keys change every frame (the stopping distance and the starting
  // distance depend on the screen shape), so they live in a ref
    const keysRef = useRef(buildCameraKeys());
  // The original starting distances, taken from a fresh copy of the path
    const startZ = useRef(
    buildCameraKeys()
      .slice(0, 2)
      .map((key) => key.position[2]),
  );
  const position = useRef(new Vector3());
  const look = useRef(new Vector3());
  const anchor = useRef(new Vector3());
  const parallax = useRef({ x: 0, y: 0 });
  const lastT = useRef(0);
  const walk = useRef(0); // 0 = standing still, 1 = walking

  useFrame((state, delta) => {
    const camera = state.camera as PerspectiveCamera;
    const keys = keysRef.current;
    const t = MathUtils.clamp(smoothRef.current, 0, 1);

    // Tall, narrow screens (phones held upright): use a wider lens and
    // start further back, so the whole facade and doors are visible
    const portrait = camera.aspect < 1 ? 1 - camera.aspect : 0;
    const lensBoost = 1 + portrait * 0.9;
    const startFov = START_FOV * lensBoost;
    const endFov = END_FOV * lensBoost;
    keys[0].position[2] = startZ.current[0] + portrait * 14;
    keys[1].position[2] = startZ.current[1] + portrait * 14;

    // How far from the masterpiece to stop so that it fills the screen
    const tanHalf = Math.tan(MathUtils.degToRad(endFov / 2));
    const { width, height } = heroSizeRef.current;
    const distance = Math.min(
      Math.max(
        height / 2 / tanHalf,
        width / 2 / (tanHalf * camera.aspect),
      ) / HERO_FILL,
      11,
    );
    const finalZ = BACK_Z + distance;
    keys[keys.length - 1].position[2] = finalZ;
    keys[keys.length - 2].position[2] = finalZ + 3.5;

    sampleKeys(keys, t, "position", position.current);
    sampleKeys(keys, t, "look", look.current);

    // A gentle walking bob and sway, only while the visitor is moving
    const speed = Math.abs(t - lastT.current) / Math.max(delta, 0.001);
    lastT.current = t;
    walk.current = MathUtils.damp(
      walk.current,
      MathUtils.clamp(speed * 12, 0, 1),
      4,
      delta,
    );

    // The final shot stays calm and steady
    const calm = 1 - 0.85 * smoothstep(0.85, 1, t);
    const time = state.clock.elapsedTime;
    const bob = Math.sin(time * 7.5) * 0.014 * walk.current * calm;
    const sway = Math.sin(time * 3.75) * 0.01 * walk.current * calm;
    const breathe = Math.sin(time * 0.9) * 0.004 * calm;

    // Very subtle mouse parallax (on phones the pointer stays centred)
    parallax.current.x = MathUtils.damp(parallax.current.x, state.pointer.x, 3, delta);
    parallax.current.y = MathUtils.damp(parallax.current.y, state.pointer.y, 3, delta);

    position.current.x += parallax.current.x * 0.25 * calm + sway;
    position.current.y += parallax.current.y * 0.1 * calm + bob + breathe;

    camera.position.copy(position.current);
    camera.lookAt(look.current);
    camera.rotateZ(-parallax.current.x * 0.012 * calm); // a tiny tilt

    // Slow lens push-in during the final stretch
    const fov = MathUtils.lerp(startFov, endFov, smoothstep(0.7, 1, t));
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    // Keep the title pinned to the wall above the door: work out where that
    // spot in 3D space lands on the screen, and move the title there
    const title = titleRef.current;
    if (title) {
      camera.updateMatrixWorld();
      anchor.current.set(...TITLE_ANCHOR).project(camera);
      title.style.top = `${((1 - anchor.current.y) / 2) * 100}%`;
    }
  });

  return null;
}