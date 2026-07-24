"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandLoadingState } from "@/components/BrandLoadingState";
import { DressDetailsDrawer } from "@/components/DressDetailsDrawer";
import { FavoritesGrid } from "@/components/FavoritesGrid";
import { MorePhotosControl } from "@/components/MorePhotosControl";
import { PinterestInspiration } from "@/components/PinterestInspiration";
import { SectionCard } from "@/components/SectionCard";
import { SwipeDeck } from "@/components/SwipeDeck";
import { formatAppointmentFull } from "@/lib/appointments";
import { dressPhotos, shopifyCdnUrl } from "@/lib/dresses";
import { MAX_FAVORITES, sortFavoritesByTitle } from "@/lib/favorites";
import {
  formatEstimatedArrivalLine,
  hasSaidYesContent,
} from "@/lib/said-yes";
import type { DressCard, DressPrepFavorite, DressPrepSession } from "@/lib/types";
import { copyText, guestSessionUrl } from "@/lib/urls";

type Props = {
  token: string;
};

function firstName(fullName: string) {
  const part = fullName.trim().split(/\s+/)[0];
  return part || fullName;
}

function hasSelectedDress(session: DressPrepSession) {
  return Boolean(
    (session.said_yes_title && session.said_yes_title.trim()) ||
      session.said_yes_shopify_product_id,
  );
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
  const [saidYesDetailsOpen, setSaidYesDetailsOpen] = useState(false);
  const [saidYesPhotoIndex, setSaidYesPhotoIndex] = useState(0);

  const favoritedIds = useMemo(
    () => new Set(favorites.map((f) => f.shopify_product_id)),
    [favorites],
  );

  useEffect(() => {
    setSaidYesPhotoIndex(0);
  }, [session?.said_yes_shopify_product_id, session?.said_yes_image_url]);

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
            let nextDresses = (dressData.dresses || []) as DressCard[];
            const saidYesId = sessionData.session
              ?.said_yes_shopify_product_id as string | null | undefined;
            if (
              saidYesId &&
              !nextDresses.some((d) => d.shopifyProductId === saidYesId)
            ) {
              try {
                const extraRes = await fetch(
                  `/api/dresses?ids=${encodeURIComponent(saidYesId)}`,
                );
                const extraData = await extraRes.json();
                if (extraRes.ok && Array.isArray(extraData.dresses)) {
                  nextDresses = [...nextDresses, ...extraData.dresses];
                }
              } catch {
                // Keep catalog-only if said-yes lookup fails.
              }
            }
            setDresses(nextDresses);
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

        const ids = [
          ...nextFavorites.map((f) => f.shopify_product_id),
          sessionData.session?.said_yes_shopify_product_id,
        ].filter(Boolean) as string[];
        if (ids.length === 0) {
          if (!cancelled) {
            setDresses([]);
            setDressesLoading(false);
          }
          return;
        }

        try {
          const uniqueIds = [...new Set(ids)];
          const dressRes = await fetch(
            `/api/dresses?ids=${encodeURIComponent(uniqueIds.join(","))}`,
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
  const showSaidYes = hasSaidYesContent(session);
  const dressSelected = hasSelectedDress(session);
  const arrivalLine = formatEstimatedArrivalLine(session.estimated_arrival_on);
  const saidYesDress = session.said_yes_shopify_product_id
    ? dresses.find(
        (d) => d.shopifyProductId === session.said_yes_shopify_product_id,
      )
    : undefined;
  const saidYesPhotos = dressPhotos(
    saidYesDress?.imageUrls,
    saidYesDress?.imageUrl ?? session.said_yes_image_url,
  );
  const saidYesPhoto =
    saidYesPhotos[
      Math.min(saidYesPhotoIndex, Math.max(saidYesPhotos.length - 1, 0))
    ] ?? null;
  const saidYesImage = shopifyCdnUrl(saidYesPhoto, 1400) || saidYesPhoto;
  const saidYesSubtitle = arrivalLine
    ? arrivalLine
    : dressSelected
      ? "The gown chosen for the wedding day."
      : "Dress details coming soon.";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-normal text-[var(--ink)] sm:text-4xl">
              {session.client_name}
            </h1>
            <p className="text-sm text-[var(--muted)] sm:text-base">
              <span className="mr-2 text-xs font-medium uppercase tracking-[0.12em]">
                Appointment
              </span>
              {formatAppointmentFull(session.appointment_at)}
            </p>
          </div>
          {!dressSelected ? (
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
          ) : null}
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
      </header>

      <div className="h-0.5 w-full bg-[var(--blush)]" />

      {showSaidYes ? (
        <>
          <SectionCard
            title="I said yes to the dress!"
            subtitle={saidYesSubtitle}
            collapsible
            defaultOpen
          >
            {dressSelected && session.said_yes_title ? (
              <div className="mx-auto flex w-full max-w-[min(100%,28rem)] flex-col items-center gap-4 sm:max-w-[min(100%,34rem)]">
                <h3 className="text-center font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--ink)] sm:text-3xl">
                  {session.said_yes_title}
                </h3>
                {saidYesImage ? (
                  <div className="relative w-full overflow-hidden rounded-2xl bg-[#eee]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={saidYesImage}
                      alt={session.said_yes_title}
                      className="aspect-[3/4] w-full object-contain object-top"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-1 p-1">
                      <button
                        type="button"
                        className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--ink)]"
                        onClick={() => setSaidYesDetailsOpen(true)}
                        aria-label={`View description for ${session.said_yes_title}`}
                        title="View description"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--blush-soft)] ring-1 ring-[var(--blush)] backdrop-blur-sm">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden
                          >
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 11v6" strokeLinecap="round" />
                            <circle
                              cx="12"
                              cy="8"
                              r="1"
                              fill="currentColor"
                              stroke="none"
                            />
                          </svg>
                        </span>
                      </button>

                      {saidYesPhotos.length > 1 ? (
                        <MorePhotosControl
                          variant="overlay"
                          index={Math.min(
                            saidYesPhotoIndex,
                            saidYesPhotos.length - 1,
                          )}
                          count={saidYesPhotos.length}
                          onPrev={() =>
                            setSaidYesPhotoIndex(
                              (prev) =>
                                (prev - 1 + saidYesPhotos.length) %
                                saidYesPhotos.length,
                            )
                          }
                          onNext={() =>
                            setSaidYesPhotoIndex(
                              (prev) => (prev + 1) % saidYesPhotos.length,
                            )
                          }
                        />
                      ) : (
                        <span />
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSaidYesDetailsOpen(true)}
                    className="text-sm font-medium text-[var(--ink)] underline"
                  >
                    View dress details
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center text-sm text-[var(--muted)] sm:text-base">
                Dress details coming soon.
              </p>
            )}
          </SectionCard>

          {saidYesDetailsOpen && session.said_yes_title ? (
            <DressDetailsDrawer
              title={session.said_yes_title}
              descriptionHtml={saidYesDress?.descriptionHtml ?? null}
              shopifyProductId={session.said_yes_shopify_product_id}
              productUrl={session.said_yes_product_url}
              onClose={() => setSaidYesDetailsOpen(false)}
            />
          ) : null}

          <div className="h-0.5 w-full bg-[var(--blush)]" />
        </>
      ) : null}

      {canEdit ? (
        <>
          <SectionCard
            title="Prep for your appointment"
            collapsible
            defaultOpen={!dressSelected}
            subtitle={
              <div className="space-y-1">
                <p>
                  Skip or Save beside the photo, or swipe left or right. Use
                  filters to narrow the list.
                </p>
                <p>
                  Save up to ten dresses you would like to try. We will have them
                  ready when you arrive.
                </p>
              </div>
            }
          >
            {nearSaveLimit ? (
              <p className="rounded-xl bg-[var(--blush-soft)] px-4 py-3 text-sm text-[var(--ink)] ring-1 ring-[var(--blush)]">
                You have one save left. Remove a dress below if you want to make
                room for another.
              </p>
            ) : null}
            {dressesLoading ? (
              <BrandLoadingState variant="panel" hint="Loading dresses…" />
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
          </SectionCard>

          <div className="h-0.5 w-full bg-[var(--blush)]" />
        </>
      ) : null}

      <SectionCard
        title={
          canEdit
            ? "These are the dresses you saved"
            : `These are the dresses ${firstName(session.client_name)} chose`
        }
        collapsible
        defaultOpen={!dressSelected}
        subtitle={
          <div className="space-y-1">
            <p>Tap a photo to view a larger image.</p>
            <p>
              Side arrows change which dress you&apos;re viewing. The Image
              arrows change photos of the same dress.
            </p>
          </div>
        }
        headerRight={
          <p className="text-sm font-medium text-[var(--ink)]">
            {favorites.length} / {MAX_FAVORITES} saved
          </p>
        }
      >
        <FavoritesGrid
          favorites={favorites}
          dresses={dresses}
          canEdit={canEdit}
          onRemove={canEdit ? removeFavorite : undefined}
        />
      </SectionCard>
    </div>
  );
}
