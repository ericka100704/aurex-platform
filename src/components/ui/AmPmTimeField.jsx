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
    <div>
      {label ? (
        <label className="mb-1 block text-xs text-white/50">{label}</label>
      ) : null}
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          className="input-luxury min-w-0 flex-1"
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
          className="input-luxury w-[5.5rem] shrink-0"
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
