import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { CatmullRomCurve3, MathUtils, Vector3 } from "three";

type ProgressRef = { current: number };
type Vec3 = [number, number, number];

// Where the camera is at 0%, 20%, 40%, 60%, 80% and 100% of the scroll.
// Coordinates: x = right, y = up, z = towards the viewer.
// The gallery runs away from us along the negative z direction.
const CAMERA_POINTS: Vec3[] = [
  [0, 1.8, 18], //   0%  outside, wide establishing shot
  [0, 1.7, 3], //   20% at the entrance
  [0, 1.7, -8], //  40% first artworks
  [0, 1.7, -17], // 60% deeper into the exhibition
  [0, 2.0, -23], // 80% the masterpiece comes into view
  [0, 2.5, -27.2], // 100% the painting fills the screen
];

// What the camera is looking at, at the same moments
const LOOK_POINTS: Vec3[] = [
  [0, 2.4, -10],
  [0, 2.4, -14],
  [-5, 2.4, -13],
  [4, 2.4, -22],
  [0, 2.5, -30],
  [0, 2.6, -30],
];

export function CameraRig({ progress }: { progress: ProgressRef }) {
  const smooth = useRef(0);
  const parallax = useRef({ x: 0, y: 0 });
  const position = useRef(new Vector3());
  const lookAt = useRef(new Vector3());

  const curves = useMemo(
    () => ({
      position: new CatmullRomCurve3(
        CAMERA_POINTS.map((p) => new Vector3(...p)),
        false,
        "centripetal",
      ),
      target: new CatmullRomCurve3(
        LOOK_POINTS.map((p) => new Vector3(...p)),
        false,
        "centripetal",
      ),
    }),
    [],
  );

  useFrame((state, delta) => {
    // Glide towards the scroll position instead of jumping to it
    smooth.current = MathUtils.damp(smooth.current, progress.current, 4, delta);
    const t = MathUtils.clamp(smooth.current, 0, 1);

    curves.position.getPoint(t, position.current);
    curves.target.getPoint(t, lookAt.current);

    // Very subtle mouse parallax
    parallax.current.x = MathUtils.damp(
      parallax.current.x,
      state.pointer.x,
      3,
      delta,
    );
    parallax.current.y = MathUtils.damp(
      parallax.current.y,
      state.pointer.y,
      3,
      delta,
    );
    position.current.x += parallax.current.x * 0.25;
    position.current.y += parallax.current.y * 0.1;

    state.camera.position.copy(position.current);
    state.camera.lookAt(lookAt.current);
  });

  return null;
}