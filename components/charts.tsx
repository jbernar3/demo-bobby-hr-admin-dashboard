"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/format";

// Hand-rolled black-and-white SVG charts. Fixed viewBox, scales to container width.

export interface BarDatum {
  label: string;
  value: number;
  /** Optional second series drawn as an outlined bar behind/beside (e.g. budget). */
  reference?: number;
  /** Visual style for this bar. */
  style?: "solid" | "hatched" | "outline" | "signal";
  /** Extra stacked segment on top (e.g. planned hires). */
  stack?: number;
  title?: string;
}

export function BarChart({
  data,
  height = 240,
  width = 720,
  yMax,
  yMin = 0,
  threshold,
  thresholdLabel,
  format = (n: number) => String(Math.round(n)),
  ariaLabel,
  referenceLabel,
  valueLabel,
}: {
  data: BarDatum[];
  height?: number;
  width?: number;
  yMax?: number;
  yMin?: number;
  threshold?: number;
  thresholdLabel?: string;
  format?: (n: number) => string;
  ariaLabel: string;
  referenceLabel?: string;
  valueLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 18, right: 12, bottom: 28, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = yMax ?? Math.max(...data.map((d) => Math.max(d.value + (d.stack ?? 0), d.reference ?? 0))) * 1.12;
  const y = (v: number) => pad.top + innerH - ((v - yMin) / (max - yMin)) * innerH;
  const band = innerW / data.length;
  const barW = Math.min(36, band * 0.56);
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => yMin + ((max - yMin) * i) / ticks);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
        <defs>
          <pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" fill="#fff" />
            <line x1="0" y1="0" x2="0" y2="5" stroke="#000" strokeWidth="1.6" />
          </pattern>
        </defs>
        {tickVals.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#e5e5e5" strokeWidth={1} />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="fill-neutral-500 font-mono text-[11px]">
              {format(t)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const cx = pad.left + band * i + band / 2;
          const x = cx - barW / 2;
          const top = y(d.value);
          const h = Math.max(0, y(yMin) - top);
          const fill = d.style === "hatched" ? "url(#hatch)" : d.style === "outline" ? "#fff" : d.style === "signal" ? "#FF2D20" : "#000";
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.left + band * i} y={pad.top} width={band} height={innerH} fill="transparent" />
              {d.reference !== undefined && (
                <rect
                  x={x - 4}
                  y={y(d.reference)}
                  width={barW + 8}
                  height={Math.max(0, y(yMin) - y(d.reference))}
                  fill="none"
                  stroke="#a3a3a3"
                  strokeDasharray="3 3"
                />
              )}
              <motion.rect
                x={x}
                width={barW}
                fill={fill}
                stroke={d.style === "outline" || d.style === "hatched" ? "#000" : "none"}
                strokeWidth={1}
                initial={{ y: y(yMin), height: 0 }}
                animate={{ y: top, height: h }}
                transition={{ duration: 0.25, delay: i * 0.02, ease: [0.2, 0, 0, 1] }}
              />
              {d.stack ? (
                <motion.rect
                  x={x}
                  width={barW}
                  fill="#fff"
                  stroke="#000"
                  strokeWidth={1.5}
                  strokeDasharray="3 2"
                  animate={{ y: y(d.value + d.stack), height: y(d.value) - y(d.value + d.stack) }}
                  initial={false}
                  transition={{ duration: 0.2 }}
                />
              ) : null}
              <text x={cx} y={height - 8} textAnchor="middle" className={cn("font-mono text-[11px]", hover === i ? "fill-black" : "fill-neutral-500")}>
                {d.label}
              </text>
            </g>
          );
        })}
        {threshold !== undefined && (
          <g>
            <line x1={pad.left} x2={width - pad.right} y1={y(threshold)} y2={y(threshold)} stroke="#000" strokeWidth={1.5} strokeDasharray="6 4" />
            {thresholdLabel && (
              <text x={width - pad.right} y={y(threshold) - 6} textAnchor="end" stroke="#fff" strokeWidth={4} paintOrder="stroke" className="fill-black font-mono text-[11px] font-semibold">
                {thresholdLabel}
              </text>
            )}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-[4px] bg-ink px-2.5 py-1.5 text-[12px] text-paper"
          style={{ left: `${((pad.left + band * hover + band / 2) / width) * 100}%`, transform: "translateX(-50%)" }}
        >
          <span className="font-semibold">{data[hover].title ?? data[hover].label}</span>
          <span className="num block">
            {valueLabel ?? "Value"}: {format(data[hover].value + (data[hover].stack ?? 0))}
          </span>
          {data[hover].reference !== undefined && (
            <span className="num block text-neutral-400">
              {referenceLabel ?? "Reference"}: {format(data[hover].reference!)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function LineChart({
  points,
  height = 220,
  width = 720,
  yMin = 0,
  yMax,
  threshold,
  thresholdLabel,
  format = (n: number) => String(Math.round(n)),
  ariaLabel,
  projectedFrom,
}: {
  points: { label: string; value: number }[];
  height?: number;
  width?: number;
  yMin?: number;
  yMax?: number;
  threshold?: number;
  thresholdLabel?: string;
  format?: (n: number) => string;
  ariaLabel: string;
  /** Index from which points are drawn dashed (partial/projected). */
  projectedFrom?: number;
}) {
  const pad = { top: 18, right: 16, bottom: 28, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = yMax ?? Math.max(...points.map((p) => p.value), threshold ?? 0) * 1.08;
  const x = (i: number) => pad.left + (points.length === 1 ? innerW / 2 : (innerW * i) / (points.length - 1));
  const y = (v: number) => pad.top + innerH - ((v - yMin) / (max - yMin)) * innerH;
  const path = (pts: { value: number }[], offset = 0) => pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i + offset)},${y(p.value)}`).join(" ");
  const solid = projectedFrom !== undefined ? points.slice(0, projectedFrom + 1) : points;
  const dashed = projectedFrom !== undefined ? points.slice(projectedFrom) : [];
  const ticks = Array.from({ length: 5 }, (_, i) => yMin + ((max - yMin) * i) / 4);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={ariaLabel}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#e5e5e5" />
          <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" className="fill-neutral-500 font-mono text-[11px]">
            {format(t)}
          </text>
        </g>
      ))}
      {threshold !== undefined && (
        <g>
          <line x1={pad.left} x2={width - pad.right} y1={y(threshold)} y2={y(threshold)} stroke="#000" strokeWidth={1.5} strokeDasharray="6 4" />
          {thresholdLabel && (
            <text x={pad.left + 6} y={y(threshold) - 6} stroke="#fff" strokeWidth={4} paintOrder="stroke" className="fill-black font-mono text-[11px] font-semibold">
              {thresholdLabel}
            </text>
          )}
        </g>
      )}
      <motion.path
        d={path(solid)}
        fill="none"
        stroke="#000"
        strokeWidth={2.25}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
      />
      {dashed.length > 1 && <path d={path(dashed, projectedFrom)} fill="none" stroke="#000" strokeWidth={2} strokeDasharray="4 4" />}
      {points.map((p, i) => {
        const over = threshold !== undefined && p.value >= threshold;
        return (
          <g key={p.label}>
            <circle cx={x(i)} cy={y(p.value)} r={over ? 4.5 : 3.5} fill={over ? "#000" : "#fff"} stroke="#000" strokeWidth={1.5}>
              <title>{`${p.label}: ${format(p.value)}`}</title>
            </circle>
            <text x={x(i)} y={height - 8} textAnchor="middle" className="fill-neutral-500 font-mono text-[11px]">
              {p.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
