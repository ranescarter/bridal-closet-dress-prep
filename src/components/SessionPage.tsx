"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandLoadingState } from "@/components/BrandLoadingState";
import { FavoritesGrid } from "@/components/FavoritesGrid";
import { PinterestInspiration } from "@/components/PinterestInspiration";
import { SwipeDeck } from "@/components/SwipeDeck";
import { formatAppointmentFull } from "@/lib/appointments";
import { MAX_FAVORITES, sortFavoritesByTitle } from "@/lib/favorites";
import type { DressCard, DressPrepFavorite, DressPrepSession } from "@/lib/types";
import { copyText, guestSessionUrl } from "@/lib/urls";

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
  const [sessionLoading, setSessionLoading] = useState(true);
  const [dressesLoading, setDressesLoading] = useState(true);
  const [dressesError, setDressesError] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);

  const favoritedIds = useMemo(
    () => new Set(favorites.map((f) => f.shopify_product_id)),
    [favorites],
  );

  useEffect(() => {
    let cancelled = false;
    const dressesAbort = new AbortController();

    async function boot() {
      setSessionLoading(true);
      setDressesLoading(true);
      setError(null);
      setDressesError(null);

      try {
        const dressesPromise = fetch("/api/dresses", {
          signal: dressesAbort.signal,
        }).catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") {
            return null;
          }
          throw err;
        });

        const sessionRes = await fetch(`/api/sessions/${token}`);
        const sessionData = await sessionRes.json();
        if (!sessionRes.ok) {
          dressesAbort.abort();
          throw new Error(sessionData.error || "Session not found");
        }
        if (cancelled) return;

        const nextRole = sessionData.role as "client" | "staff";
        const nextFavorites = (sessionData.favorites ||
          []) as DressPrepFavorite[];
        setSession(sessionData.session);
        setRole(nextRole);
        setFavorites(nextFavorites);
        setSessionLoading(false);

        if (nextRole === "client") {
          try {
            const dressRes = await dressesPromise;
            if (cancelled) return;
            if (!dressRes) {
              setDressesLoading(false);
              return;
            }
            const dressData = await dressRes.json();
            if (!dressRes.ok) {
              throw new Error(dressData.error || "Could not load dresses");
            }
            setDresses(dressData.dresses || []);
          } catch (err) {
            if (cancelled) return;
            if (err instanceof DOMException && err.name === "AbortError") return;
            setDressesError(
              err instanceof Error ? err.message : "Could not load dresses",
            );
          } finally {
            if (!cancelled) setDressesLoading(false);
          }
          return;
        }

        dressesAbort.abort();

        const ids = nextFavorites
          .map((f) => f.shopify_product_id)
          .filter(Boolean);
        if (ids.length === 0) {
          if (!cancelled) {
            setDresses([]);
            setDressesLoading(false);
          }
          return;
        }

        try {
          const dressRes = await fetch(
            `/api/dresses?ids=${encodeURIComponent(ids.join(","))}`,
          );
          const dressData = await dressRes.json();
          if (cancelled) return;
          if (!dressRes.ok) {
            setDresses([]);
          } else {
            setDresses(dressData.dresses || []);
          }
        } catch {
          if (!cancelled) setDresses([]);
        } finally {
          if (!cancelled) setDressesLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load");
        setSessionLoading(false);
        setDressesLoading(false);
      }
    }

    void boot();
    return () => {
      cancelled = true;
      dressesAbort.abort();
    };
  }, [token]);

  async function saveFavorite(dress: DressCard) {
    if (
      favorites.length >= MAX_FAVORITES &&
      !favorites.some((f) => f.shopify_product_id === dress.shopifyProductId)
    ) {
      throw new Error(
        `You can save up to ${MAX_FAVORITES} dresses. Remove one to save another.`,
      );
    }

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
      return sortFavoritesByTitle([...prev, data.favorite]);
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
    await copyText(guestSessionUrl(session.staff_token));
    setCopiedShare(true);
    window.setTimeout(() => setCopiedShare(false), 2000);
  }

  if (sessionLoading) {
    return <BrandLoadingState variant="page" />;
  }

  if (error || !session || !role) {
    return (
      <p className="rounded-2xl bg-red-50 px-4 py-6 text-center text-red-700">
        {error || "Session not found"}
      </p>
    );
  }

  const canEdit = role === "client";
  const atSaveLimit = favorites.length >= MAX_FAVORITES;
  const nearSaveLimit = favorites.length === MAX_FAVORITES - 1;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 border-b border-[var(--blush)] pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-3">
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
          <PinterestInspiration
            token={token}
            pinterestUrl={session.pinterest_url}
            canEdit={canEdit}
            onSaved={(url) =>
              setSession((prev) =>
                prev
                  ? {
                      ...prev,
                      pinterest_url: url,
                      pinterest_updated_at: url
                        ? new Date().toISOString()
                        : null,
                    }
                  : prev,
              )
            }
          />
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
              Skip or Save beside the photo, or swipe left or right. Use filters
              to narrow the list.
            </p>
            <p className="text-sm text-[var(--muted)] sm:text-base">
              Save up to ten dresses you would like to try. We will have them
              ready when you arrive.
            </p>
            {nearSaveLimit ? (
              <p className="rounded-xl bg-[var(--blush-soft)] px-4 py-3 text-sm text-[var(--ink)] ring-1 ring-[var(--blush)]">
                You have one save left. Remove a dress below if you want to make
                room for another.
              </p>
            ) : null}
          </div>
          {dressesLoading ? (
            <BrandLoadingState
              variant="panel"
              hint="Loading dresses…"
            />
          ) : dressesError ? (
            <p className="rounded-2xl bg-red-50 px-4 py-6 text-center text-red-700">
              {dressesError}
            </p>
          ) : (
            <SwipeDeck
              dresses={dresses}
              favoritedIds={favoritedIds}
              atSaveLimit={atSaveLimit}
              onSave={saveFavorite}
            />
          )}
        </section>
      ) : null}

      <section
        className={`space-y-4 ${
          canEdit ? "border-t border-[var(--blush)] pt-6" : ""
        }`}
      >
        <div className="space-y-1">
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              {canEdit
                ? "These are the dresses you saved"
                : `These are the dresses ${firstName(session.client_name)} chose`}
            </h2>
            <p className="shrink-0 text-sm text-[var(--muted)]">
              {favorites.length} / {MAX_FAVORITES} saved
            </p>
          </div>
          <div className="space-y-1 text-sm text-[var(--muted)] sm:text-base">
            <p>Tap a photo to view a larger image.</p>
            <p>
              Side arrows change which dress you&apos;re viewing. The Image
              arrows change photos of the same dress.
            </p>
          </div>
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
