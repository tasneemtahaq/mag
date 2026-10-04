import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { MathUtils, MeshStandardMaterial, TextureLoader } from "three";
import type { Group, Texture } from "three";
import {
  DOOR_HALF,
  DOOR_HEIGHT,
  FACADE_HEIGHT,
  FACADE_WIDTH,
  FRONT_Z,
  HALF_WIDTH,
  ROOM_CENTER_Z,
  ROOM_DEPTH,
  ROOM_HEIGHT,
  BACK_Z,
  doorOpenAmount,
} from "@/components/gallery-3d/gallery-layout";
import type { ProgressRef, Vec3 } from "@/components/gallery-3d/gallery-layout";
import { prepareTexture } from "@/components/gallery-3d/texture-utils";

const WHITE = "#f6f4f0";
const HALF_FACADE = FACADE_WIDTH / 2;

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

// The room itself: floor, walls and ceiling
export function Room() {
  return (
    <group>
      {/* Ground outside */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#e8dfd6" roughness={1} />
      </mesh>

      {/* Polished white floor: low roughness gives soft reflections */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, ROOM_CENTER_Z]}>
        <planeGeometry args={[HALF_WIDTH * 2, ROOM_DEPTH]} />
        <meshStandardMaterial color="#f1efea" roughness={0.18} metalness={0.05} />
      </mesh>

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
    </group>
  );
}

// A box whose front face shows one rectangular piece of the big mural.
// Because every piece reads its own part of the same image, the mural
// looks continuous across the walls and the closed doors.
function MuralBox({
  mural,
  plain,
  x0,
  x1,
  y0,
  y1,
  depth,
}: {
  mural: Texture;
  plain: MeshStandardMaterial;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  depth: number;
}) {
  const map = useMemo(() => {
    const piece = mural.clone();
    piece.repeat.set((x1 - x0) / FACADE_WIDTH, (y1 - y0) / FACADE_HEIGHT);
    piece.offset.set((x0 + HALF_FACADE) / FACADE_WIDTH, y0 / FACADE_HEIGHT);
    piece.needsUpdate = true;
    return piece;
  }, [mural, x0, x1, y0, y1]);

  useEffect(() => () => map.dispose(), [map]);

  return (
    <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, FRONT_Z]}>
      <boxGeometry args={[x1 - x0, y1 - y0, depth]} />
      {/* Box faces in order: right, left, top, bottom, FRONT, back */}
      <primitive object={plain} attach="material-0" />
      <primitive object={plain} attach="material-1" />
      <primitive object={plain} attach="material-2" />
      <primitive object={plain} attach="material-3" />
      <meshStandardMaterial attach="material-4" map={map} roughness={0.85} />
      <primitive object={plain} attach="material-5" />
    </mesh>
  );
}

function ReveallLine({ args, position }: { args: Vec3; position: Vec3 }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#2a2928" roughness={0.6} />
    </mesh>
  );
}

// One sliding door. It slides sideways into the wall beside it.
function Door({
  side,
  smooth,
  mural,
  plain,
}: {
  side: -1 | 1;
  smooth: ProgressRef;
  mural: Texture;
  plain: MeshStandardMaterial;
}) {
  const group = useRef<Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const open = doorOpenAmount(MathUtils.clamp(smooth.current, 0, 1));
    group.current.position.x = side * open * DOOR_HALF;
  });

  const x0 = side < 0 ? -DOOR_HALF : 0;
  const x1 = side < 0 ? 0 : DOOR_HALF;

  return (
    <group ref={group}>
      {/* Thinner than the wall, so the closed door sits slightly recessed */}
      <MuralBox
        mural={mural}
        plain={plain}
        x0={x0}
        x1={x1}
        y0={0}
        y1={DOOR_HEIGHT}
        depth={0.3}
      />
      {/* A dark seam where the two doors meet */}
      <ReveallLine
        args={[0.04, DOOR_HEIGHT, 0.02]}
        position={[side * 0.02, DOOR_HEIGHT / 2, FRONT_Z + 0.16]}
      />
    </group>
  );
}

// The front of the building: a graffiti wall with two sliding doors
export function Facade({ smooth }: { smooth: ProgressRef }) {
  const loaded = useLoader(TextureLoader, "/gallery/graffiti-wall.jpg");
  const mural = useMemo(() => prepareTexture(loaded, 16), [loaded]);
  const plain = useMemo(
    () => new MeshStandardMaterial({ color: WHITE, roughness: 0.9 }),
    [],
  );
  useEffect(() => () => plain.dispose(), [plain]);

  const lineZ = FRONT_Z + 0.26;

  return (
    <group>
      {/* Left and right wings of the wall */}
      <MuralBox mural={mural} plain={plain} x0={-HALF_FACADE} x1={-DOOR_HALF} y0={0} y1={FACADE_HEIGHT} depth={0.5} />
      <MuralBox mural={mural} plain={plain} x0={DOOR_HALF} x1={HALF_FACADE} y0={0} y1={FACADE_HEIGHT} depth={0.5} />
      {/* Above the doors */}
      <MuralBox mural={mural} plain={plain} x0={-DOOR_HALF} x1={DOOR_HALF} y0={DOOR_HEIGHT} y1={FACADE_HEIGHT} depth={0.5} />

      <Door side={-1} smooth={smooth} mural={mural} plain={plain} />
      <Door side={1} smooth={smooth} mural={mural} plain={plain} />

      {/* Thin dark lines framing the doorway */}
      <ReveallLine args={[0.05, DOOR_HEIGHT, 0.02]} position={[-DOOR_HALF, DOOR_HEIGHT / 2, lineZ]} />
      <ReveallLine args={[0.05, DOOR_HEIGHT, 0.02]} position={[DOOR_HALF, DOOR_HEIGHT / 2, lineZ]} />
      <ReveallLine args={[DOOR_HALF * 2 + 0.05, 0.05, 0.02]} position={[0, DOOR_HEIGHT, lineZ]} />
    </group>
  );
}