import type { Vector3 } from "three";

export type Vec3 = [number, number, number];
export type ProgressRef = { current: number };
export type HeroSizeRef = { current: { width: number; height: number } };

// ---------- The corridor (in metres). It runs away from us along negative z. ----------
export const HALF_WIDTH = 3.4;
export const CEILING_Y = 9;
export const START_Z = 6.5; // the wall behind the camera
export const HALL_END_Z = -11.5; // the cream entrance hall ends, terracotta begins
export const CHAMBER_Z = -30; // terracotta ends, the cream end chamber begins
export const BACK_Z = -36; // the far wall, where the masterpiece hangs

// ---------- Track lighting ----------
export const RAIL_Y = 7.4;
export const RAIL_X = 2.1;
export const FIXTURE_Z = Array.from(
  { length: 11 },
  (_, index) => 1.5 - index * 3.25,
);

// ---------- Where artworks hang (every second light has a painting below it) ----------
export const SIDE_Z = [1, 3, 5, 7, 9].map((index) => FIXTURE_Z[index]);
export const SIDE_CENTER_Y = 2.5;
export const SIDE_MAX_SIZE = { width: 2.6, height: 3.2 };
export const HERO_CENTER_Y = 2.9;
export const HERO_MAX_SIZE = { width: 5.4, height: 3.8 };

// ---------- Camera lens ----------
export const START_FOV = 50;
export const END_FOV = 42;
export const HERO_FILL = 0.96; // the masterpiece fills this share of the screen

// ---------- Choreography ----------
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

// The frosted door slides away over the first 20% of the scroll
export const DOOR_START = 0;
export const DOOR_END = 0.2;

// still: the camera pauses at this key (no speed), which keeps it from drifting
export type CameraKey = {
  t: number;
  position: Vec3;
  look: Vec3;
  still?: boolean;
};

// Where the camera is (and looks) at key moments of the scroll.
// The z values of the last two keys are recalculated every frame so the
// masterpiece always fills the screen, whatever shape your image is.
export function buildCameraKeys(): CameraKey[] {
  return [
    { t: 0.0, position: [0, 1.65, 4.5], look: [0, 2.7, -20] }, // the door is closed
    { t: 0.14, position: [0, 1.65, 4.5], look: [0, 2.7, -20], still: true }, // door opening
    { t: 0.32, position: [0, 1.65, -5], look: [-1.2, 2.5, -16] }, // stepping in
    { t: 0.5, position: [0.3, 1.65, -12], look: [1.2, 2.5, -24] }, // passing the artworks
    { t: 0.7, position: [0, 1.7, -19], look: [0, 2.7, BACK_Z] }, // turning to the masterpiece
    { t: 0.85, position: [0, 2.1, -26], look: [0, HERO_CENTER_Y, BACK_Z] },
    { t: 1.0, position: [0, 2.5, -30], look: [0, HERO_CENTER_Y, BACK_Z] },
  ];
}

function tangent(
  keys: CameraKey[],
  index: number,
  which: "position" | "look",
  axis: number,
) {
  // Start and end gently, and stand still on "still" keys
  if (index === 0 || index === keys.length - 1 || keys[index].still) return 0;
  const prev = keys[index - 1];
  const next = keys[index + 1];
  return (next[which][axis] - prev[which][axis]) / (next.t - prev.t);
}

// A smooth path through the keys, hitting each one at exactly its time
// (a cubic Hermite spline).
export function sampleKeys(
  keys: CameraKey[],
  t: number,
  which: "position" | "look",
  out: Vector3,
) {
  const last = keys.length - 1;
  const time = Math.min(Math.max(t, keys[0].t), keys[last].t);

  let i = 0;
  while (i < last - 1 && time > keys[i + 1].t) i++;

  const k0 = keys[i];
  const k1 = keys[i + 1];
  const h = k1.t - k0.t;
  const s = (time - k0.t) / h;
  const s2 = s * s;
  const s3 = s2 * s;

  const h00 = 2 * s3 - 3 * s2 + 1;
  const h10 = s3 - 2 * s2 + s;
  const h01 = -2 * s3 + 3 * s2;
  const h11 = s3 - s2;

  for (let axis = 0; axis < 3; axis++) {
    const p0 = k0[which][axis];
    const p1 = k1[which][axis];
    const m0 = tangent(keys, i, which, axis);
    const m1 = tangent(keys, i + 1, which, axis);
    out.setComponent(axis, h00 * p0 + h10 * h * m0 + h01 * p1 + h11 * h * m1);
  }
  return out;
}