import type { Vector3 } from "three";

export type Vec3 = [number, number, number];
export type ProgressRef = { current: number };
export type HeroSizeRef = { current: { width: number; height: number } };

// ---------- Building dimensions (in metres) ----------
export const HALF_WIDTH = 6;
export const ROOM_HEIGHT = 6;
export const FRONT_Z = 4; // the entrance wall
export const BACK_Z = -30; // the far wall, where the masterpiece hangs
export const ROOM_DEPTH = FRONT_Z - BACK_Z;
export const ROOM_CENTER_Z = (FRONT_Z + BACK_Z) / 2;

export const DOOR_HALF = 2.75; // each of the two doors is 2.75 m wide
export const DOOR_HEIGHT = 4;
export const FACADE_WIDTH = 28; // the graffiti wall: 28 m wide...
export const FACADE_HEIGHT = 6; // ...and 6 m tall
// The spot on the wall, above the door, where the title is pinned (x, y, z in metres)
export const TITLE_ANCHOR: Vec3 = [0, 5, FRONT_Z + 0.3];

// ---------- Where artworks hang ----------
export const HERO_CENTER_Y = 2.9;
export const HERO_MAX_SIZE = { width: 7, height: 4.4 };
export const SIDE_CENTER_Y = 2.5;
export const SIDE_MAX_SIZE = { width: 2.8, height: 3.2 };
export const SIDE_Z = [-4, -11, -18, -25];

// ---------- Camera lens ----------
export const START_FOV = 50;
export const END_FOV = 42;
export const HERO_FILL = 0.96; // the masterpiece fills this share of the screen

// ---------- Choreography ----------
export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

// The doors slide open between 6% and 22% of the scroll journey
export const DOOR_OPEN_START = 0.06;
export const DOOR_OPEN_END = 0.22;

export function doorOpenAmount(progress: number) {
  return smoothstep(DOOR_OPEN_START, DOOR_OPEN_END, progress);
}

export type CameraKey = { t: number; position: Vec3; look: Vec3 };

// Where the camera is (and looks) at key moments of the scroll.
// The z values of the last two keys are recalculated every frame so the
// masterpiece always fills the screen, whatever shape your image is.
export function buildCameraKeys(): CameraKey[] {
  return [
    { t: 0.0, position: [0, 1.7, 15], look: [0, 3.0, FRONT_Z] }, // closed doors
    { t: 0.1, position: [0, 1.7, 12.5], look: [0, 2.8, FRONT_Z] }, // doors opening
    { t: 0.25, position: [0, 1.7, 6.5], look: [0, 2.6, -6] }, // doors open
    { t: 0.4, position: [0, 1.7, -3], look: [-3.5, 2.4, -12] }, // inside
    { t: 0.55, position: [0.4, 1.7, -11], look: [4, 2.4, -18] }, // passing artworks
    { t: 0.7, position: [0, 1.75, -14], look: [0, 2.6, -29] }, // turning to the masterpiece
    { t: 0.85, position: [0, 2.1, -22], look: [0, HERO_CENTER_Y, BACK_Z] },
    { t: 1.0, position: [0, 2.6, -26], look: [0, HERO_CENTER_Y, BACK_Z] },
  ];
}

function tangent(
  keys: CameraKey[],
  index: number,
  which: "position" | "look",
  axis: number,
) {
  // Start and end gently: zero speed at the very first and last key
  if (index === 0 || index === keys.length - 1) return 0;
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