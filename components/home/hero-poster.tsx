// A drawn picture of the same corridor, in correct perspective.
// The vanishing point is the middle of the picture.
const VP = { x: 800, y: 430 };

type Side = -1 | 1;

// Where a point on a side wall lands in the picture.
// d: distance from the viewer (1 = nearest, bigger = further away)
// v: 0 = the line where the wall meets the ceiling, 1 = where it meets the floor
function wall(side: Side, d: number, v: number) {
  const x = VP.x + side * (800 / d);
  const top = VP.y - 430 / d;
  const bottom = VP.y + 470 / d;
  return [x, top + v * (bottom - top)] as const;
}

// A point on the ceiling (xm = metres from the middle, 3.4 = the wall)
function ceiling(xm: number, d: number) {
  return [VP.x + ((xm / 3.4) * 800) / d, VP.y - 430 / d] as const;
}

const pts = (points: ReadonlyArray<readonly [number, number]>) =>
  points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

const quad = (side: Side, d1: number, d2: number, v1: number, v2: number) =>
  pts([wall(side, d1, v1), wall(side, d2, v1), wall(side, d2, v2), wall(side, d1, v2)]);

const FRAMES: [number, number, string][] = [
  [1.35, 1.9, "#d9b48c"],
  [2.4, 3.2, "#3f5d6e"],
  [4.1, 5.6, "#c98a5a"],
  [7.2, 9.6, "#e0cfae"],
];

const LIGHTS = [1.4, 1.9, 2.6, 3.6, 5, 7, 9.5];

export function HeroPoster() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 size-full"
    >
      <defs>
        <linearGradient id="poster-ceiling" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a1d12" />
          <stop offset="1" stopColor="#8c3b26" />
        </linearGradient>
        <linearGradient id="poster-wall" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6e2c1c" />
          <stop offset="1" stopColor="#a54a30" />
        </linearGradient>
        <linearGradient id="poster-floor" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#a8947a" />
          <stop offset="1" stopColor="#d9c6a8" />
        </linearGradient>
        <linearGradient id="poster-wash" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.75" />
          <stop offset="1" stopColor="#ffb070" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="poster-glow">
          <stop offset="0" stopColor="#ffe9bf" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffe9bf" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Ceiling, floor, side walls */}
      <polygon
        points={pts([[0, 0], [1600, 0], [865, 395], [735, 395]])}
        fill="url(#poster-ceiling)"
      />
      <polygon
        points={pts([[0, 900], [1600, 900], [865, 468], [735, 468]])}
        fill="url(#poster-floor)"
      />
      {([-1, 1] as const).map((side) => (
        <g key={side}>
          <polygon points={quad(side, 1, 12.3, 0, 1)} fill="url(#poster-wall)" />
          {/* The cream entrance hall in the foreground */}
          <polygon points={quad(side, 1, 5, 0, 1)} fill="#e6dccb" opacity="0.9" />
          {FRAMES.map(([d1, d2, color]) => (
            <g key={d1}>
              <polygon
                points={quad(side, d1, d2, 0.5, 0.88)}
                fill={color}
                stroke="#141210"
                strokeWidth="5"
              />
            </g>
          ))}
        </g>
      ))}

      {/* The beam of light from the window, across the left wall */}
      <polygon points={quad(-1, 2.6, 10, 0.05, 0.9)} fill="url(#poster-wash)" />
      <polygon
        points={pts([ceiling(1.45, 3), ceiling(2.55, 3), ceiling(2.55, 8), ceiling(1.45, 8)])}
        fill="#fff3dc"
        opacity="0.9"
      />

      {/* The cream end wall, its painting and the bench */}
      <rect x="735" y="395" width="130" height="73" fill="#e6dccb" />
      <rect x="772" y="412" width="56" height="34" fill="#b9663f" stroke="#141210" strokeWidth="2" />
      <rect x="772" y="458" width="56" height="8" fill="#2b1a12" />

      {/* Track rails and their spotlights */}
      {([-1, 1] as const).map((side) => {
        const railPoint = (d: number) =>
          [VP.x + side * (494 / d), VP.y - 336 / d] as const;
        return (
          <g key={side}>
            <polyline
              points={pts([railPoint(1.1), railPoint(12)])}
              fill="none"
              stroke="#141210"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {LIGHTS.map((d) => {
              const [x, y] = railPoint(d);
              return (
                <g key={d}>
                  <circle cx={x} cy={y + 40 / d} r={70 / d} fill="url(#poster-glow)" />
                  <circle cx={x} cy={y + 8 / d} r={Math.max(2.5, 14 / d)} fill="#141210" />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}