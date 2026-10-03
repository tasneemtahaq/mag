import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { SpotLight } from "three";
import { CameraRig } from "@/components/gallery-3d/camera-rig";

type ProgressRef = { current: number };
type Vec3 = [number, number, number];

// ---- Building dimensions (in metres) ----
const HALF_WIDTH = 6;
const ROOM_HEIGHT = 6;
const FRONT_Z = 4; // the entrance wall
const BACK_Z = -30; // the far wall, where the masterpiece hangs
const DOOR_HALF = 2.75; // the entrance is 5.5 m wide and 4 m tall
const ROOM_DEPTH = FRONT_Z - BACK_Z;
const ROOM_CENTER_Z = (FRONT_Z + BACK_Z) / 2;

const WHITE = "#f6f4f0";

// Where paintings hang along each side wall
const SIDE_Z = [-4, -11, -18, -25];

// ---- Procedural artwork (drawn with the browser's 2D canvas) ----

// A tiny seeded random generator, so every painting is the same on every visit
function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PALETTES = [
  ["#0f0f0f", "#f4f1ea", "#b08d57", "#8c2f2f"],
  ["#1f3a5f", "#e8e0d2", "#d9a441", "#3c6e71"],
  ["#2b2a28", "#e8e0d2", "#9b2c2c", "#f4f1ea"],
  ["#0b3d2e", "#f4f1ea", "#c9a45c", "#7a1f3d"],
];

function createArtTexture(seed: number, width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  if (!ctx) return texture;

  const random = seededRandom(seed);
  const palette = PALETTES[seed % PALETTES.length];

  ctx.fillStyle = palette[1];
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 8; i++) {
    ctx.globalAlpha = 0.55 + random() * 0.4;
    ctx.fillStyle = palette[Math.floor(random() * palette.length)];
    const w = width * (0.15 + random() * 0.5);
    const h = height * (0.15 + random() * 0.5);
    const x = random() * (width - w);
    const y = random() * (height - h);
    if (random() > 0.5) {
      ctx.fillRect(x, y, w, h);
    } else {
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  texture.needsUpdate = true;
  return texture;
}

// ---- Building blocks ----

function Wall({
  size,
  position,
  rotation = [0, 0, 0],
}: {
  size: [number, number];
  position: Vec3;
  rotation?: Vec3;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={size} />
      <meshStandardMaterial color={WHITE} roughness={0.95} />
    </mesh>
  );
}

function FacadeBlock({ args, position }: { args: Vec3; position: Vec3 }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={WHITE} roughness={0.9} />
    </mesh>
  );
}

function Building() {
  const wingWidth = 14 - DOOR_HALF;
  const wingCenter = DOOR_HALF + wingWidth / 2;

  return (
    <group>
      {/* Ground outside */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#d8d4cb" roughness={1} />
      </mesh>

      {/* Polished white floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, ROOM_CENTER_Z]}>
        <planeGeometry args={[HALF_WIDTH * 2, ROOM_DEPTH]} />
        <meshStandardMaterial color="#f1efea" roughness={0.25} metalness={0.05} />
      </mesh>

      {/* Interior walls and ceiling */}
      <Wall size={[HALF_WIDTH * 2, ROOM_HEIGHT]} position={[0, 3, BACK_Z]} />
      <Wall
        size={[ROOM_DEPTH, ROOM_HEIGHT]}
        position={[-HALF_WIDTH, 3, ROOM_CENTER_Z]}
        rotation={[0, Math.PI / 2, 0]}
      />
      <Wall
        size={[ROOM_DEPTH, ROOM_HEIGHT]}
        position={[HALF_WIDTH, 3, ROOM_CENTER_Z]}
        rotation={[0, -Math.PI / 2, 0]}
      />
      <Wall
        size={[HALF_WIDTH * 2, ROOM_DEPTH]}
        position={[0, ROOM_HEIGHT, ROOM_CENTER_Z]}
        rotation={[Math.PI / 2, 0, 0]}
      />

      {/* Front facade with a wide entrance */}
      <FacadeBlock
        args={[wingWidth, ROOM_HEIGHT, 0.5]}
        position={[-wingCenter, 3, FRONT_Z]}
      />
      <FacadeBlock
        args={[wingWidth, ROOM_HEIGHT, 0.5]}
        position={[wingCenter, 3, FRONT_Z]}
      />
      <FacadeBlock
        args={[DOOR_HALF * 2, 2, 0.5]}
        position={[0, 5, FRONT_Z]}
      />
    </group>
  );
}

function Artwork({
  position,
  rotationY = 0,
  width,
  height,
  seed,
}: {
  position: Vec3;
  rotationY?: number;
  width: number;
  height: number;
  seed: number;
}) {
  const texture = useMemo(
    () =>
      createArtTexture(seed, Math.round(width * 160), Math.round(height * 160)),
    [seed, width, height],
  );

  // Free the GPU memory when the scene is removed
  useEffect(() => () => texture.dispose(), [texture]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Thin black frame */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[width + 0.14, height + 0.14, 0.08]} />
        <meshStandardMaterial color="#141414" roughness={0.6} />
      </mesh>
      {/* The painting */}
      <mesh position={[0, 0, 0.085]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
    </group>
  );
}

// A ceiling spotlight aimed at one painting
function ArtSpot({
  position,
  target,
  intensity,
  angle,
}: {
  position: Vec3;
  target: Vec3;
  intensity: number;
  angle: number;
}) {
  const light = useRef<SpotLight>(null);
  const [tx, ty, tz] = target;

  useEffect(() => {
    const spot = light.current;
    if (!spot) return;
    spot.target.position.set(tx, ty, tz);
    spot.target.updateMatrixWorld();
  }, [tx, ty, tz]);

  return (
    <spotLight
      ref={light}
      position={position}
      angle={angle}
      penumbra={0.9}
      intensity={intensity}
      decay={2}
      color="#fff4e0"
    />
  );
}

export function GalleryScene({ progress }: { progress: ProgressRef }) {
  return (
    <>
      <color attach="background" args={["#e9e7e1"]} />
      <fog attach="fog" args={["#e9e7e1", 40, 120]} />

      {/* General, soft light */}
      <hemisphereLight color="#ffffff" groundColor="#d9d4c8" intensity={1} />
      <ambientLight intensity={0.3} />

      <Building />

      {/* Paintings on the side walls, each with its own spotlight */}
      {SIDE_Z.map((z, i) => (
        <group key={z}>
          <Artwork
            position={[-HALF_WIDTH, 2.4, z]}
            rotationY={Math.PI / 2}
            width={2.6}
            height={2.6}
            seed={i * 2 + 1}
          />
          <ArtSpot
            position={[-HALF_WIDTH + 2.4, 5.8, z]}
            target={[-HALF_WIDTH, 2.4, z]}
            intensity={120}
            angle={0.45}
          />
          <Artwork
            position={[HALF_WIDTH, 2.4, z]}
            rotationY={-Math.PI / 2}
            width={2.6}
            height={2.6}
            seed={i * 2 + 2}
          />
          <ArtSpot
            position={[HALF_WIDTH - 2.4, 5.8, z]}
            target={[HALF_WIDTH, 2.4, z]}
            intensity={120}
            angle={0.45}
          />
        </group>
      ))}

      {/* The masterpiece on the far wall */}
      <Artwork position={[0, 2.6, BACK_Z]} width={6} height={4} seed={11} />
      <ArtSpot
        position={[0, 5.8, BACK_Z + 6]}
        target={[0, 2.6, BACK_Z]}
        intensity={300}
        angle={0.6}
      />

      <CameraRig progress={progress} />
    </>
  );
}