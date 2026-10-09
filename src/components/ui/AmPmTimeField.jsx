"use client";

import { joinClockTime, splitClockTime } from "@/lib/utils";

/**
 * Admin time picker: type hour:minute + choose AM/PM (stores 24h "HH:mm").
 */
export default function AmPmTimeField({
  label,
  value,
  onChange,
  fallback = "06:00",
}) {
  const parts = splitClockTime(value, fallback);

  function emit(nextHour12, nextMinute, nextPeriod) {
    onChange?.(joinClockTime(nextHour12, nextMinute, nextPeriod));
  }

  return (
    <div className="min-w-0">
      {label ? (
        <label className="mb-1.5 block text-xs text-white/50">{label}</label>
      ) : null}
      <div className="flex h-[46px] overflow-hidden rounded-2xl border border-white/10 bg-black/40 focus-within:border-magenta/55 focus-within:shadow-[0_0_0_1px_rgba(138,43,226,0.35)]">
        <input
          type="text"
          inputMode="numeric"
          className="min-w-0 flex-1 bg-transparent px-4 text-base text-white outline-none placeholder:text-white/35"
          placeholder="11:00"
          value={parts.display}
          onChange={(e) => {
            const raw = e.target.value.trim();
            const match = raw.match(/^(\d{1,2})(?::(\d{0,2}))?$/);
            if (!match) return;
            const hour12 = Number(match[1]);
            if (!Number.isFinite(hour12) || hour12 < 1 || hour12 > 12) return;
            const minutePart = match[2];
            const minute =
              minutePart === undefined || minutePart === ""
                ? parts.minute
                : Number(minutePart.padEnd(2, "0").slice(0, 2));
            if (!Number.isFinite(minute) || minute < 0 || minute > 59) return;
            emit(hour12, minute, parts.period);
          }}
          aria-label={label ? `${label} time` : "Time"}
        />
        <select
          className="w-[4.75rem] shrink-0 cursor-pointer border-l border-white/10 bg-white/[0.04] px-2 text-sm font-medium text-white outline-none"
          value={parts.period}
          onChange={(e) => emit(parts.hour12, parts.minute, e.target.value)}
          aria-label={label ? `${label} AM or PM` : "AM or PM"}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
