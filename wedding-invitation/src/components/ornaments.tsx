import type { CSSProperties, ReactNode } from "react";

/* Ornament tones come from the global tokens in styles.css. */
const LEAVES = ["var(--leaf)", "var(--leaf-deep)", "var(--leaf-soft)"];
const BLOOMS = ["var(--blush)", "var(--blush-2)", "var(--white)", "var(--petal)"];
const tone = (list: string[], i: number) => list[i % list.length] ?? "currentColor";

/** Short, stable number formatting so the server and the browser render identical markup. */
const n = (value: number) => String(Number(value.toFixed(2)));

function LeafShape({
  x,
  y,
  len,
  angle,
  fill,
}: {
  x: number;
  y: number;
  len: number;
  angle: number;
  fill: string;
}) {
  const d = `M${n(x)} ${n(y)} q${n(len * 0.42)} ${n(-len * 0.32)} ${n(len)} 0 q${n(-len * 0.58)} ${n(len * 0.32)} ${n(-len)} 0z`;
  return <path d={d} transform={`rotate(${n(angle)} ${n(x)} ${n(y)})`} style={{ fill }} />;
}

function Bloom({ x, y, r, fill }: { x: number; y: number; r: number; fill: string }) {
  return (
    <>
      {Array.from({ length: 5 }, (_, k) => (
        <circle
          key={k}
          cx={n(x + Math.cos(k * 1.2566) * r * 0.62)}
          cy={n(y + Math.sin(k * 1.2566) * r * 0.62)}
          r={n(r * 0.5)}
          style={{ fill }}
        />
      ))}
      <circle cx={n(x)} cy={n(y)} r={n(r * 0.28)} style={{ fill: "var(--gold-light)" }} />
    </>
  );
}

/* ---------- Seal wreath ---------- */
const WREATH_LEAVES = 28;
const WREATH_RADIUS = 118;

/**
 * A ring of sage leaves with a few blossoms around the Ganesh seal on the opening gate.
 * The CSS draws the ring, fades each leaf in on its own `--d` delay and turns the wreath slowly.
 */
export function SealWreath() {
  const items: ReactNode[] = [];
  for (let k = 0; k < WREATH_LEAVES; k++) {
    const a = (k * 360) / WREATH_LEAVES - 90;
    const rad = (a * Math.PI) / 180;
    const x = 150 + Math.cos(rad) * WREATH_RADIUS;
    const y = 150 + Math.sin(rad) * WREATH_RADIUS;
    items.push(
      <g key={`leaf-${k}`} className="lf" style={{ "--d": `${300 + k * 48}ms` } as CSSProperties}>
        <LeafShape
          x={x}
          y={y}
          len={22}
          angle={a + 90 + (k % 2 ? 28 : -28)}
          fill={tone(LEAVES, k)}
        />
      </g>,
    );
    if (k % 7 === 3) {
      items.push(
        <g
          key={`bloom-${k}`}
          className="bl"
          style={{ "--d": `${1500 + k * 30}ms` } as CSSProperties}
        >
          <Bloom x={x} y={y} r={8} fill={tone(BLOOMS, k)} />
        </g>,
      );
    }
  }
  return (
    <svg className="wreath" viewBox="0 0 300 300" aria-hidden="true">
      <circle
        className="ring"
        cx="150"
        cy="150"
        r={WREATH_RADIUS}
        fill="none"
        strokeOpacity=".5"
        strokeWidth="1"
        style={{ stroke: "var(--gold)" }}
      />
      {items}
    </svg>
  );
}

/* ---------- Garland ---------- */
const SWAG = 170; // width of one swag
const SWAGS = 24; // enough swags to span very wide screens; the strip clips the rest
const GARLAND_H = 84;
const TOP = 2;
const DIP = 52;

/** One swag, from x = 0 to x = SWAG: a curved stem with leaves along it, a few blossoms and a knot. */
function Swag() {
  const mx = SWAG / 2;
  const cy = DIP * 2 - TOP;
  const items: ReactNode[] = [
    <path
      key="stem"
      d={`M0 ${TOP} Q${mx} ${cy} ${SWAG} ${TOP}`}
      fill="none"
      strokeWidth="1.4"
      style={{ stroke: "var(--leaf-deep)" }}
    />,
  ];
  for (let k = 1; k < 14; k++) {
    const t = k / 14;
    const x = 2 * (1 - t) * t * mx + t * t * SWAG;
    const y = (1 - t) * (1 - t) * TOP + 2 * (1 - t) * t * cy + t * t * TOP;
    const tangent =
      (Math.atan2(2 * (1 - t) * (cy - TOP) + 2 * t * (TOP - cy), SWAG) * 180) / Math.PI;
    items.push(
      <LeafShape
        key={`leaf-${k}`}
        x={x}
        y={y}
        len={16}
        angle={tangent + (k % 2 ? 55 : -55)}
        fill={tone(LEAVES, k)}
      />,
    );
    if (k % 4 === 2)
      items.push(<Bloom key={`bloom-${k}`} x={x} y={y + 4} r={6.5} fill={tone(BLOOMS, k)} />);
  }
  items.push(
    <Bloom key="knot" x={0} y={TOP + 8} r={8} fill="var(--white)" />,
    <LeafShape key="knot-a" x={0} y={TOP + 8} len={18} angle={100} fill={tone(LEAVES, 1)} />,
    <LeafShape key="knot-b" x={0} y={TOP + 8} len={18} angle={60} fill={tone(LEAVES, 0)} />,
  );
  return <>{items}</>;
}

/** Floral garland swaying along the top edge of a section. */
export function Garland() {
  const width = SWAG * SWAGS;
  return (
    <div className="garland" aria-hidden="true">
      <svg width={width} height={GARLAND_H} viewBox={`0 0 ${width} ${GARLAND_H}`}>
        <defs>
          <g id="garland-swag">
            <Swag />
          </g>
        </defs>
        {Array.from({ length: SWAGS }, (_, i) => (
          <use key={i} href="#garland-swag" x={i * SWAG} />
        ))}
      </svg>
    </div>
  );
}
