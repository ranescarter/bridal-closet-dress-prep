"use client";

import { useState } from "react";
import { AppointmentTimePicker } from "@/components/AppointmentTimePicker";
import {
  appointmentToIso,
  to24HourTime,
  type Meridiem,
} from "@/lib/appointments";
import type { DressPrepSession } from "@/lib/types";

type Props = {
  onCreated: (session: DressPrepSession) => void;
  onCancel?: () => void;
  onUnauthorized?: () => void;
};

export function StaffCreateForm({ onCreated, onCancel, onUnauthorized }: Props) {
  const [clientName, setClientName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [hour12, setHour12] = useState("10");
  const [minute, setMinute] = useState("00");
  const [meridiem, setMeridiem] = useState<Meridiem>("AM");
  const [hasTime, setHasTime] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setTimePart(
    next: Partial<{ hour12: string; minute: string; meridiem: Meridiem }>,
  ) {
    if (next.hour12 !== undefined) setHour12(next.hour12);
    if (next.minute !== undefined) setMinute(next.minute);
    if (next.meridiem !== undefined) setMeridiem(next.meridiem);
    setHasTime(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const appointmentAt = appointmentToIso(
        appointmentDate,
        hasTime ? to24HourTime(hour12, minute, meridiem) : null,
      );

      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName,
          appointmentAt,
        }),
      });
      if (res.status === 401) {
        onUnauthorized?.();
        throw new Error("Session expired. Please sign in again.");
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create session");
      onCreated(data.session as DressPrepSession);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--ink)]">
            Set up a new bride
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Enter the client&apos;s name and appointment. Links will appear in
            the table below.
          </p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 text-sm text-[var(--muted)] underline"
          >
            Cancel
          </button>
        ) : null}
      </div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-[var(--ink)]">Name</span>
        <input
          required
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--blush)] focus:ring-2 focus:ring-[var(--blush)]"
          placeholder="Heather Carter"
        />
      </label>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-[var(--ink)]">Appointment</p>
          <p className="text-sm text-[var(--muted)]">
            Date and time of the in-store appointment (shown to the bride as a
            reminder).
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[var(--ink)]">Date</span>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--blush)] focus:ring-2 focus:ring-[var(--blush)]"
            />
          </label>

          <div className="block space-y-2">
            <span className="text-sm font-medium text-[var(--ink)]">Time</span>
            <AppointmentTimePicker
              hour12={hour12}
              minute={minute}
              meridiem={meridiem}
              hasTime={hasTime}
              onChange={setTimePart}
            />
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-[var(--blush)] px-4 py-3 font-medium text-[var(--ink)] transition hover:bg-[var(--blush)]/80 disabled:opacity-60"
      >
        {loading ? "Creating…" : "Create links"}
      </button>
    </form>
  );
}
