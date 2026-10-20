import { cn } from "@/lib/format";

// Tile grid map of the US (col, row). Simple on purpose.
const TILES: Record<string, [number, number]> = {
  AK: [0, 0], ME: [10, 0],
  WI: [5, 1], VT: [9, 1], NH: [10, 1],
  WA: [0, 2], ID: [1, 2], MT: [2, 2], ND: [3, 2], MN: [4, 2], IL: [5, 2], MI: [6, 2], NY: [8, 2], MA: [9, 2],
  OR: [0, 3], NV: [1, 3], WY: [2, 3], SD: [3, 3], IA: [4, 3], IN: [5, 3], OH: [6, 3], PA: [7, 3], NJ: [8, 3], CT: [9, 3], RI: [10, 3],
  CA: [0, 4], UT: [1, 4], CO: [2, 4], NE: [3, 4], MO: [4, 4], KY: [5, 4], WV: [6, 4], VA: [7, 4], MD: [8, 4], DE: [9, 4],
  AZ: [1, 5], NM: [2, 5], KS: [3, 5], AR: [4, 5], TN: [5, 5], NC: [6, 5], SC: [7, 5], DC: [8, 5],
  OK: [3, 6], LA: [4, 6], MS: [5, 6], AL: [6, 6], GA: [7, 6],
  HI: [0, 7], TX: [3, 7], FL: [8, 7],
};

export function TileMap({ counts, highlight }: { counts: Record<string, number>; highlight?: string }) {
  const max = Math.max(...Object.values(counts));
  const size = 44;
  const gap = 4;
  return (
    <svg viewBox={`0 0 ${11 * (size + gap)} ${8 * (size + gap)}`} className="h-auto w-full" role="img" aria-label={`Employees by state: ${Object.entries(counts).map(([s, n]) => `${s} ${n}`).join(", ")}`}>
      {Object.entries(TILES).map(([st, [c, r]]) => {
        const n = counts[st] ?? 0;
        const x = c * (size + gap);
        const y = r * (size + gap);
        const radius = n ? 3 + Math.sqrt(n / max) * 11 : 0;
        const isHi = st === highlight;
        return (
          <g key={st}>
            <rect
              x={x}
              y={y}
              width={size}
              height={size}
              rx={3}
              className={cn(isHi ? "fill-black" : n ? "fill-neutral-100" : "fill-neutral-50")}
              stroke={isHi ? "#000" : n ? "#d4d4d4" : "none"}
            />
            <text x={x + 5} y={y + 12} className={cn("font-mono text-[9.5px] font-semibold", isHi ? "fill-white" : n ? "fill-neutral-700" : "fill-neutral-300")}>
              {st}
            </text>
            {n > 0 && (
              <>
                <circle cx={x + size / 2} cy={y + size / 2 + 5} r={radius} className={isHi ? "fill-white" : "fill-black"} />
                <text x={x + size - 5} y={y + size - 5} textAnchor="end" className={cn("font-mono text-[9.5px] font-bold", isHi ? "fill-white" : "fill-black")}>
                  {radius > 9 ? "" : n}
                </text>
                {radius > 9 && (
                  <text x={x + size / 2} y={y + size / 2 + 8.5} textAnchor="middle" className="fill-white font-mono text-[10px] font-bold">
                    {n}
                  </text>
                )}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
