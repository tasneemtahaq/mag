import { ArtSpot } from "@/components/gallery-3d/artworks";
import {
  BACK_Z,
  CEILING_Y,
  CHAMBER_Z,
  FIXTURE_Z,
  HALF_WIDTH,
  HALL_END_Z,
  RAIL_X,
  RAIL_Y,
  SIDE_CENTER_Y,
  START_Z,
} from "@/components/gallery-3d/gallery-layout";

// Colours: change these to restyle the whole gallery
const CREAM = "#e6dccb";
const TERRACOTTA = "#8c3b26";
const FLOOR = "#cbb79a";
const DARK = "#141210";

// A stretch of side wall between two z positions
function Wall({
  side,
  from,
  to,
  color,
}: {
  side: -1 | 1;
  from: number;
  to: number;
  color: string;
}) {
  return (
    <mesh
      position={[side * HALF_WIDTH, CEILING_Y / 2, (from + to) / 2]}
      rotation={[0, -side * (Math.PI / 2), 0]}
    >
      <planeGeometry args={[from - to, CEILING_Y]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

function Ceiling({
  from,
  to,
  color,
}: {
  from: number;
  to: number;
  color: string;
}) {
  return (
    <mesh
      position={[0, CEILING_Y, (from + to) / 2]}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[HALF_WIDTH * 2, from - to]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

// One black track rail along the ceiling
function Rail({ side }: { side: -1 | 1 }) {
  const from = START_Z - 0.5;
  const to = CHAMBER_Z - 1.5;
  return (
    <mesh position={[side * RAIL_X, RAIL_Y, (from + to) / 2]}>
      <boxGeometry args={[0.07, 0.07, from - to]} />
      <meshStandardMaterial color={DARK} roughness={0.5} metalness={0.6} />
    </mesh>
  );
}

// One black spotlight on a rail, tilted towards the wall
function Fixture({ side, z }: { side: -1 | 1; z: number }) {
  const tilt = Math.atan2(side * (HALF_WIDTH - RAIL_X), RAIL_Y - SIDE_CENTER_Y);
  return (
    <group position={[side * RAIL_X, RAIL_Y - 0.14, z]} rotation={[0, 0, tilt]}>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.07, 0.14, 0.07]} />
        <meshStandardMaterial color={DARK} roughness={0.5} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.09, 0.11, 0.32, 16]} />
        <meshStandardMaterial color={DARK} roughness={0.45} metalness={0.5} />
      </mesh>
      {/* The glowing lens at the front */}
      <mesh position={[0, -0.165, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.012, 16]} />
        <meshBasicMaterial color="#fff1cc" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function Room({ lite }: { lite: boolean }) {
  const length = START_Z - BACK_Z;

  return (
    <group>
      {/* Warm stone floor, with soft reflections */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, (START_Z + BACK_Z) / 2]}
      >
        <planeGeometry args={[HALF_WIDTH * 2, length]} />
        <meshStandardMaterial color={FLOOR} roughness={0.32} metalness={0.02} />
      </mesh>

      {/* Cream entrance hall, terracotta corridor, cream end chamber */}
      {([-1, 1] as const).map((side) => (
        <group key={side}>
          <Wall side={side} from={START_Z} to={HALL_END_Z} color={CREAM} />
          <Wall side={side} from={HALL_END_Z} to={CHAMBER_Z} color={TERRACOTTA} />
          <Wall side={side} from={CHAMBER_Z} to={BACK_Z} color={CREAM} />
          {/* A dark skirting board along the bottom */}
          <mesh
            position={[
              side * (HALF_WIDTH - 0.025),
              0.07,
              (START_Z + BACK_Z) / 2,
            ]}
          >
            <boxGeometry args={[0.05, 0.14, length]} />
            <meshStandardMaterial color="#3a2a20" roughness={0.7} />
          </mesh>
        </group>
      ))}

      <Ceiling from={START_Z} to={CHAMBER_Z} color={TERRACOTTA} />
      <Ceiling from={CHAMBER_Z} to={BACK_Z} color={CREAM} />

      {/* The far wall, and the wall behind the camera */}
      <mesh position={[0, CEILING_Y / 2, BACK_Z]}>
        <planeGeometry args={[HALF_WIDTH * 2, CEILING_Y]} />
        <meshStandardMaterial color={CREAM} roughness={0.95} />
      </mesh>
      <mesh position={[0, CEILING_Y / 2, START_Z]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[HALF_WIDTH * 2, CEILING_Y]} />
        <meshStandardMaterial color={CREAM} roughness={0.95} />
      </mesh>

      {/* Track lighting: two rails, and a spotlight every few metres */}
      <Rail side={-1} />
      <Rail side={1} />
      {FIXTURE_Z.map((z) => (
        <group key={z}>
          <Fixture side={-1} z={z} />
          <Fixture side={1} z={z} />
        </group>
      ))}

      {/* The window high in the ceiling, and the beam of light it throws across the left wall */}
      <mesh position={[2.0, CEILING_Y - 0.01, -10]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 5.5]} />
        <meshBasicMaterial color="#fff3dc" toneMapped={false} />
      </mesh>
      <ArtSpot
        position={[2.0, 8.6, -10]}
        target={[-HALF_WIDTH, 3.2, -17.5]}
        intensity={lite ? 380 : 450}
        angle={0.75}
      />

      {/* A bench in front of the masterpiece */}
      <mesh position={[0, 0.25, BACK_Z + 2.4]}>
        <boxGeometry args={[2.4, 0.5, 0.7]} />
        <meshStandardMaterial color="#2b1a12" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.52, BACK_Z + 2.4]}>
        <boxGeometry args={[2.3, 0.06, 0.64]} />
        <meshStandardMaterial color="#4a2e1f" roughness={0.45} />
      </mesh>
    </group>
  );
}