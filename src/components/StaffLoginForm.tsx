"use client";

import { useState } from "react";

type Props = {
  onSuccess: () => void;
  title?: string;
};

export function StaffLoginForm({
  onSuccess,
  title = "Appointment prep dashboard",
}: Props) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign in");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-normal text-[var(--ink)]">
          {title}
        </h1>
        <p className="text-[var(--muted)]">Staff sign-in required</p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5"
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[var(--ink)]">Password</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--blush)] focus:ring-2 focus:ring-[var(--blush)]"
          />
        </label>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--blush)] px-4 py-3 font-medium text-[var(--ink)] transition hover:bg-[var(--blush)]/80 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
