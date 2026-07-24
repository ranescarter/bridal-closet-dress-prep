"use client";

import { useState } from "react";
import { validatePinterestUrlInput } from "@/lib/pinterest";

type Props = {
  token: string;
  pinterestUrl: string | null;
  canEdit: boolean;
  onSaved: (url: string | null) => void;
};

export function PinterestInspiration({
  token,
  pinterestUrl,
  canEdit,
  onSaved,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(pinterestUrl || "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraft(pinterestUrl || "");
    setError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(pinterestUrl || "");
    setError(null);
    setEditing(false);
  }

  async function save(nextRaw: string | null) {
    setSaving(true);
    setError(null);
    try {
      if (nextRaw != null && nextRaw.trim()) {
        const local = validatePinterestUrlInput(nextRaw);
        if (!local.ok) {
          setError(local.error);
          return;
        }
      }

      const res = await fetch(`/api/sessions/${token}/pinterest`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: nextRaw != null && nextRaw.trim() ? nextRaw.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not save Pinterest link");
      }
      onSaved(data.session?.pinterest_url ?? null);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit && !pinterestUrl) {
    return null;
  }

  if (!canEdit && pinterestUrl) {
    return (
      <p className="text-sm text-[var(--muted)] sm:text-base">
        <a
          href={pinterestUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--ink)] underline"
        >
          View bride&apos;s Pinterest board
        </a>
      </p>
    );
  }

  if (editing || !pinterestUrl) {
    return (
      <div className="space-y-2 rounded-xl bg-[var(--blush-soft)] px-4 py-3 ring-1 ring-[var(--blush)]">
        <p className="text-sm text-[var(--ink)]">
          Have a Pinterest board? Add the link so we can see your inspiration.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="https://www.pinterest.com/…"
            className="w-full flex-1 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--blush)] focus:ring-2 focus:ring-[var(--blush)]"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save(draft)}
              className="rounded-full bg-[var(--blush)] px-4 py-2 text-sm font-medium text-[var(--ink)] disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {pinterestUrl || editing ? (
              <button
                type="button"
                disabled={saving}
                onClick={cancelEdit}
                className="rounded-full px-3 py-2 text-sm text-[var(--muted)] underline disabled:opacity-50"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base">
      <a
        href={pinterestUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[var(--ink)] underline"
      >
        View your Pinterest board
      </a>
      <button
        type="button"
        onClick={startEdit}
        className="text-[var(--muted)] underline"
      >
        Edit
      </button>
      <button
        type="button"
        disabled={saving}
        onClick={() => void save(null)}
        className="text-[var(--muted)] underline disabled:opacity-50"
      >
        Remove
      </button>
    </div>
  );
}
