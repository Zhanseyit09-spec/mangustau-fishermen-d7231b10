import { LOCATIONS, LOCATION_COORDS, type Location } from "@/lib/fishery-store";

interface Props {
  totals: Record<Location, number>;
}

export function MangystauMap({ totals }: Props) {
  const max = Math.max(1, ...LOCATIONS.map((l) => totals[l]));
  const top = LOCATIONS.reduce<Location>((a, b) => (totals[b] > totals[a] ? b : a), LOCATIONS[0]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-[oklch(0.20_0.06_240)] to-[oklch(0.14_0.05_240)]">
      <svg viewBox="0 0 100 100" className="block w-full" preserveAspectRatio="xMidYMid meet">
        {/* Caspian sea body */}
        <defs>
          <linearGradient id="sea" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.30 0.10 220)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="oklch(0.22 0.08 220)" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="pulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="oklch(0.78 0.18 195)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="oklch(0.78 0.18 195)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100" height="100" fill="url(#sea)" />
        {/* Mangystau coastline (stylized peninsula on the right) */}
        <path
          d="M100 0 L55 8 L48 18 L42 28 L46 40 L34 52 L42 64 L40 78 L48 90 L60 96 L100 100 Z"
          fill="oklch(0.32 0.05 80)"
          stroke="oklch(0.50 0.08 80)"
          strokeWidth="0.4"
          opacity="0.85"
        />
        {/* Grid lines */}
        {[20, 40, 60, 80].map((p) => (
          <g key={p} opacity="0.08">
            <line x1="0" y1={p} x2="100" y2={p} stroke="white" strokeWidth="0.2" />
            <line x1={p} y1="0" x2={p} y2="100" stroke="white" strokeWidth="0.2" />
          </g>
        ))}
        {/* Zone markers */}
        {LOCATIONS.map((loc) => {
          const c = LOCATION_COORDS[loc];
          const intensity = totals[loc] / max;
          const r = 2 + intensity * 7;
          const isTop = loc === top && totals[loc] > 0;
          return (
            <g key={loc}>
              {totals[loc] > 0 && (
                <circle cx={c.x} cy={c.y} r={r + 6} fill="url(#pulse)">
                  <animate attributeName="r" values={`${r + 4};${r + 10};${r + 4}`} dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={c.x}
                cy={c.y}
                r={r}
                fill={isTop ? "oklch(0.72 0.22 25)" : "oklch(0.78 0.16 195)"}
                stroke="white"
                strokeWidth="0.5"
              />
              <text x={c.x + 3} y={c.y - 2} fontSize="3.2" fill="white" fontWeight="600">
                {c.label}
              </text>
              <text x={c.x + 3} y={c.y + 2.5} fontSize="2.6" fill="oklch(0.85 0.05 195)">
                {totals[loc].toFixed(0)} кг
              </text>
            </g>
          );
        })}
        {/* Caspian label */}
        <text x="10" y="50" fontSize="3.4" fill="oklch(0.70 0.08 220)" fontStyle="italic" opacity="0.7">
          Каспий теңізі
        </text>
      </svg>
      {/* Legend */}
      <div className="absolute bottom-2 right-2 flex items-center gap-3 rounded-md bg-background/70 px-2.5 py-1.5 text-[10px] backdrop-blur">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[oklch(0.78_0.16_195)]" /> Зона</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[oklch(0.72_0.22_25)]" /> Көшбасшы</span>
      </div>
    </div>
  );
}
