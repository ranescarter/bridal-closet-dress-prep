"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FavoritesGrid } from "@/components/FavoritesGrid";
import { SwipeDeck } from "@/components/SwipeDeck";
import { formatAppointmentFull } from "@/lib/appointments";
import type { DressCard, DressPrepFavorite, DressPrepSession } from "@/lib/types";
import { absoluteUrl, copyText } from "@/lib/urls";

type Props = {
  token: string;
};

function firstName(fullName: string) {
  const part = fullName.trim().split(/\s+/)[0];
  return part || fullName;
}

export function SessionPage({ token }: Props) {
  const [session, setSession] = useState<DressPrepSession | null>(null);
  const [role, setRole] = useState<"client" | "staff" | null>(null);
  const [favorites, setFavorites] = useState<DressPrepFavorite[]>([]);
  const [dresses, setDresses] = useState<DressCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedShare, setCopiedShare] = useState(false);

  const favoritedIds = useMemo(
    () => new Set(favorites.map((f) => f.shopify_product_id)),
    [favorites],
  );

  const loadSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${token}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Session not found");
    setSession(data.session);
    setRole(data.role);
    setFavorites(data.favorites || []);
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setLoading(true);
      setError(null);
      try {
        await loadSession();
        const dressRes = await fetch("/api/dresses");
        const dressData = await dressRes.json();
        if (!dressRes.ok) throw new Error(dressData.error || "Could not load dresses");
        if (!cancelled) setDresses(dressData.dresses || []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [loadSession]);

  async function saveFavorite(dress: DressCard) {
    const res = await fetch(`/api/sessions/${token}/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shopifyProductId: dress.shopifyProductId,
        title: dress.title,
        handle: dress.handle,
        imageUrl: dress.imageUrl,
        productUrl: dress.productUrl,
        descriptionHtml: dress.descriptionHtml,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not save");
    setFavorites((prev) => {
      if (prev.some((f) => f.shopify_product_id === dress.shopifyProductId)) {
        return prev;
      }
      return [...prev, data.favorite];
    });
  }

  async function removeFavorite(shopifyProductId: string) {
    const res = await fetch(
      `/api/sessions/${token}/favorites?shopifyProductId=${encodeURIComponent(shopifyProductId)}`,
      { method: "DELETE" },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Could not remove");
    setFavorites((prev) =>
      prev.filter((f) => f.shopify_product_id !== shopifyProductId),
    );
  }

  async function copyViewOnlyLink() {
    if (!session?.staff_token) return;
    await copyText(absoluteUrl(`/s/${session.staff_token}`));
    setCopiedShare(true);
    window.setTimeout(() => setCopiedShare(false), 2000);
  }

  if (loading) {
    return <p className="text-center text-[var(--muted)]">Loading…</p>;
  }

  if (error || !session || !role) {
    return (
      <p className="rounded-2xl bg-red-50 px-4 py-6 text-center text-red-700">
        {error || "Session not found"}
      </p>
    );
  }

  const canEdit = role === "client";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 border-b border-[var(--blush)] pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="space-y-1">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-normal text-[var(--ink)] sm:text-3xl">
            {session.client_name}
          </h1>
          <p className="text-sm text-[var(--muted)] sm:text-base">
            <span className="mr-2 text-xs font-medium uppercase tracking-[0.12em]">
              Appointment
            </span>
            {formatAppointmentFull(session.appointment_at)}
          </p>
        </div>

        {canEdit ? (
          <button
            type="button"
            onClick={() => void copyViewOnlyLink()}
            className="rounded-full bg-[var(--blush)] px-4 py-2 text-sm font-medium text-[var(--ink)] transition hover:bg-[var(--blush-soft)] sm:shrink-0"
          >
            {copiedShare ? "Copied" : "Copy family link"}
          </button>
        ) : null}
      </div>

      {canEdit ? (
        <section className="space-y-4">
          <div className="space-y-1 border-b border-[var(--blush)] pb-4">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Prep for your appointment
            </h2>
            <p className="text-sm text-[var(--muted)] sm:text-base">
              Skip or Save beside the photo — or swipe left / right. Use filters
              to narrow the list.
            </p>
            <p className="text-sm text-[var(--muted)] sm:text-base">
              Save a few you&apos;d like to try — we&apos;ll have them ready when
              you arrive.
            </p>
          </div>
          <SwipeDeck
            dresses={dresses}
            favoritedIds={favoritedIds}
            onSave={saveFavorite}
          />
        </section>
      ) : null}

      <section
        className={`space-y-4 ${
          canEdit ? "border-t border-[var(--blush)] pt-8" : ""
        }`}
      >
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {canEdit
              ? "These are the dresses you saved"
              : `These are the dresses ${firstName(session.client_name)} chose`}
          </h2>
          <p className="shrink-0 text-sm text-[var(--muted)]">
            {favorites.length} saved
          </p>
        </div>
        <FavoritesGrid
          favorites={favorites}
          dresses={dresses}
          canEdit={canEdit}
          onRemove={canEdit ? removeFavorite : undefined}
        />
      </section>
    </div>
  );
}
