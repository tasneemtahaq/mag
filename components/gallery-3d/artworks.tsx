import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, SRGBColorSpace, TextureLoader } from "three";
import type { SpotLight, Texture } from "three";
import {
  BACK_Z,
  HALF_WIDTH,
  HERO_CENTER_Y,
  HERO_MAX_SIZE,
  SIDE_CENTER_Y,
  SIDE_MAX_SIZE,
  SIDE_Z,
} from "@/components/gallery-3d/gallery-layout";
import type {
  HeroSizeRef,
  Vec3,
} from "@/components/gallery-3d/gallery-layout";
import {
  fitInside,
  prepareTexture,
  textureAspect,
} from "@/components/gallery-3d/texture-utils";
import { galleryArtworks } from "@/lib/gallery-artworks.generated";

// ---------- A soft shadow texture, shared by every frame ----------
let shadowTexture: CanvasTexture | null = null;

function getShadowTexture() {
  if (shadowTexture) return shadowTexture;
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const inner = size * 0.2; // the solid middle sits hidden behind the frame
    ctx.fillStyle = "#000";
    ctx.shadowColor = "rgba(0,0,0,0.9)";
    ctx.shadowBlur = 40;
    ctx.fillRect(inner, inner, size - inner * 2, size - inner * 2);
  }
  shadowTexture = new CanvasTexture(canvas);
  return shadowTexture;
}

// ---------- Placeholder paintings (used until you add your own images) ----------
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

// ---------- Hanging one framed artwork ----------
function FramedArtwork({
  texture,
  width,
  height,
  position,
  rotationY = 0,
}: {
  texture: Texture;
  width: number;
  height: number;
  position: Vec3;
  rotationY?: number;
}) {
  const shadow = useMemo(() => getShadowTexture(), []);
  const frameWidth = width + 0.14;
  const frameHeight = height + 0.14;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Soft shadow on the wall behind the frame */}
      <mesh position={[0, -0.12, 0.004]}>
        <planeGeometry args={[frameWidth / 0.6, frameHeight / 0.6]} />
        <meshBasicMaterial
          map={shadow}
          transparent
          opacity={0.45}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
          toneMapped={false}
        />
      </mesh>
      {/* Thin black frame */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[frameWidth, frameHeight, 0.08]} />
        <meshStandardMaterial color="#141414" roughness={0.5} />
      </mesh>
      {/* The artwork */}
      <mesh position={[0, 0, 0.085]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} roughness={0.85} />
      </mesh>
    </group>
  );
}

// A ceiling spotlight aimed at one artwork
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

function SideArtwork({
  texture,
  side,
  z,
  width,
  height,
  showSpot,
}: {
  texture: Texture;
  side: -1 | 1;
  z: number;
  width: number;
  height: number;
  showSpot: boolean;
}) {
  return (
    <>
      <FramedArtwork
        texture={texture}
        width={width}
        height={height}
        position={[side * HALF_WIDTH, SIDE_CENTER_Y, z]}
        rotationY={(-side * Math.PI) / 2}
      />
      {showSpot && (
        <ArtSpot
          position={[side * (HALF_WIDTH - 2.4), 5.8, z]}
          target={[side * HALF_WIDTH, SIDE_CENTER_Y, z]}
          intensity={120}
          angle={0.45}
        />
      )}
    </>
  );
}

function HeroArtwork({
  texture,
  width,
  height,
}: {
  texture: Texture;
  width: number;
  height: number;
}) {
  return (
    <>
      <FramedArtwork
        texture={texture}
        width={width}
        height={height}
        position={[0, HERO_CENTER_Y, BACK_Z]}
      />
      <ArtSpot
        position={[0, 5.8, BACK_Z + 6]}
        target={[0, HERO_CENTER_Y, BACK_Z]}
        intensity={300}
        angle={0.6}
      />
    </>
  );
}

// On phones only the first two pairs of paintings get their own spotlight
const hasSpot = (lite: boolean, index: number) => !lite || index < 2;

// ---------- Your images ----------
function ImageArtworks({
  paths,
  heroSizeRef,
  lite,
}: {
  paths: string[];
  heroSizeRef: HeroSizeRef;
  lite: boolean;
}) {
  const loaded = useLoader(TextureLoader, paths);
  const textures = useMemo(() => loaded.map((t) => prepareTexture(t)), [loaded]);

  // The first image is the masterpiece. With a single image, it hangs everywhere.
  const hero = textures[0];
  const sides = textures.length > 1 ? textures.slice(1) : textures;

  const heroFit = useMemo(
    () => fitInside(textureAspect(hero), HERO_MAX_SIZE.width, HERO_MAX_SIZE.height),
    [hero],
  );

  // Tell the camera how big the masterpiece is
  useEffect(() => {
    heroSizeRef.current = heroFit;
  }, [heroFit, heroSizeRef]);

  return (
    <>
      <HeroArtwork texture={hero} width={heroFit.width} height={heroFit.height} />
      {SIDE_Z.map((z, i) =>
        ([-1, 1] as const).map((side, s) => {
          const texture = sides[(i * 2 + s) % sides.length];
          const fit = fitInside(
            textureAspect(texture),
            SIDE_MAX_SIZE.width,
            SIDE_MAX_SIZE.height,
          );
          return (
            <SideArtwork
              key={`${z}-${side}`}
              texture={texture}
              side={side}
              z={z}
              width={fit.width}
              height={fit.height}
              showSpot={hasSpot(lite, i)}
            />
          );
        }),
      )}
    </>
  );
}

// ---------- Placeholder paintings ----------
function PlaceholderArtworks({ lite }: { lite: boolean }) {
  const textures = useMemo(
    () => [
      createArtTexture(11, 960, 640), // masterpiece
      ...Array.from({ length: SIDE_Z.length * 2 }, (_, i) =>
        createArtTexture(i + 1, 416, 416),
      ),
    ],
    [],
  );
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures]);

  return (
    <>
      <HeroArtwork texture={textures[0]} width={6} height={4} />
      {SIDE_Z.map((z, i) =>
        ([-1, 1] as const).map((side, s) => (
          <SideArtwork
            key={`${z}-${side}`}
            texture={textures[1 + i * 2 + s]}
            side={side}
            z={z}
            width={2.6}
            height={2.6}
            showSpot={hasSpot(lite, i)}
          />
        )),
      )}
    </>
  );
}

export function Artworks({
  heroSizeRef,
  lite,
}: {
  heroSizeRef: HeroSizeRef;
  lite: boolean;
}) {
  if (galleryArtworks.length > 0) {
    // Phones download the small copies of each image
    const paths = galleryArtworks.map((item) => (lite ? item.small : item.full));
    return (
      <ImageArtworks paths={paths} heroSizeRef={heroSizeRef} lite={lite} />
    );
  }
  return <PlaceholderArtworks lite={lite} />;
}