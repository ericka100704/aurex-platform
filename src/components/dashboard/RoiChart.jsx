"use client";

import { useMemo, useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { formatCurrency, cn } from "@/lib/utils";

const RANGES = ["1D", "1W", "1M", "6M", "1Y"];

export default function RoiChart({ data = [] }) {
  const [range, setRange] = useState("1W");
  const max = Math.max(...data.map((d) => d.earned), 1);
  const total = data.reduce((s, d) => s + Number(d.earned || 0), 0);

  const areaPath = useMemo(() => {
    if (!data.length) return "";
    const w = 100;
    const h = 100;
    const step = data.length > 1 ? w / (data.length - 1) : w;
    const points = data.map((item, i) => {
      const x = i * step;
      const y = h - (item.earned / max) * 78 - 8;
      return [x, y];
    });
    const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
    const last = points[points.length - 1];
    const first = points[0];
    return `${line} L ${last[0]} ${h} L ${first[0]} ${h} Z`;
  }, [data, max]);

  const strokePath = useMemo(() => {
    if (!data.length) return "";
    const w = 100;
    const h = 100;
    const step = data.length > 1 ? w / (data.length - 1) : w;
    return data
      .map((item, i) => {
        const x = i * step;
        const y = h - (item.earned / max) * 78 - 8;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [data, max]);

  return (
    <GlassCard className="!rounded-[1.75rem] !p-5" hover={false}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-white">ROI Timeline</h3>
          <p className="mt-1 text-xs text-white/40">
            Daily ROI this week · {formatCurrency(total)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={cn("pill !px-2.5 !py-1", range === item && "pill-active")}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-black/20 p-2 md:h-32">
        {data.length ? (
          <>
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="h-full w-full"
            >
              <defs>
                <linearGradient id="roiFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF69B4" stopOpacity="0.45" />
                  <stop offset="55%" stopColor="#8A2BE2" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#8A2BE2" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="roiStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="55%" stopColor="#FF69B4" />
                  <stop offset="100%" stopColor="#8A2BE2" />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#roiFill)" />
              <path
                d={strokePath}
                fill="none"
                stroke="url(#roiStroke)"
                strokeWidth="1.8"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-between px-1">
              {data.map((item) => (
                <span
                  key={item.day}
                  className="text-[10px] uppercase tracking-wider text-white/35"
                >
                  {item.day}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/35">
            No earnings data yet
          </div>
        )}
      </div>
    </GlassCard>
  );
}
