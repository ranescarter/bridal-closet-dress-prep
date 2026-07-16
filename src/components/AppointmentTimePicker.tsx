"use client";

import {
  APPOINTMENT_HOURS,
  APPOINTMENT_MINUTES,
  type Meridiem,
} from "@/lib/appointments";

type Props = {
  hour12: string;
  minute: string;
  meridiem: Meridiem;
  hasTime: boolean;
  onChange: (
    next: Partial<{ hour12: string; minute: string; meridiem: Meridiem }>,
  ) => void;
  variant?: "form" | "inline";
};

export function AppointmentTimePicker({
  hour12,
  minute,
  meridiem,
  hasTime,
  onChange,
  variant = "form",
}: Props) {
  const compact = variant === "inline";
  const fieldClass = compact
    ? "rounded-lg border border-black/10 px-1 py-1 text-sm"
    : "min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-3 py-3 outline-none focus:border-[var(--blush)] focus:ring-2 focus:ring-[var(--blush)]";
  const meridiemActiveClass = compact
    ? "bg-[var(--blush)]"
    : "bg-[var(--ink)] text-white";
  const meridiemIdleClass = compact
    ? "bg-white"
    : "bg-white text-[var(--ink)] hover:bg-[var(--blush-soft)]";

  return (
    <div className={`flex items-${compact ? "center" : "stretch"} gap-2`}>
      <select
        aria-label="Hour"
        value={hour12}
        onChange={(e) => onChange({ hour12: e.target.value })}
        className={fieldClass}
      >
        {APPOINTMENT_HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span
        className={compact ? undefined : "flex items-center text-[var(--muted)]"}
        aria-hidden
      >
        :
      </span>
      <select
        aria-label="Minute"
        value={minute}
        onChange={(e) => onChange({ minute: e.target.value })}
        className={fieldClass}
      >
        {APPOINTMENT_MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
      <div
        className={
          compact
            ? "flex flex-col overflow-hidden rounded-lg border border-black/10 text-xs"
            : "flex w-14 shrink-0 flex-col overflow-hidden rounded-xl border border-black/10"
        }
        role="group"
        aria-label="AM or PM"
      >
        <button
          type="button"
          onClick={() => onChange({ meridiem: "AM" })}
          className={`${compact ? "px-1.5 py-0.5" : "flex-1 px-2 py-1 text-xs font-semibold"} ${
            hasTime && meridiem === "AM" ? meridiemActiveClass : meridiemIdleClass
          }`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => onChange({ meridiem: "PM" })}
          className={`border-t border-black/10 ${compact ? "px-1.5 py-0.5" : "flex-1 px-2 py-1 text-xs font-semibold"} ${
            hasTime && meridiem === "PM" ? meridiemActiveClass : meridiemIdleClass
          }`}
        >
          PM
        </button>
      </div>
    </div>
  );
}
