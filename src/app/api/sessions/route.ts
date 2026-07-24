import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { requireStaffAuth } from "@/lib/staff-auth";
import { badRequest, readJsonBody, serverError } from "@/lib/http";

export async function GET() {
  try {
    const unauthorized = await requireStaffAuth();
    if (unauthorized) return unauthorized;

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("dress_prep_sessions")
      .select(
        "*, dress_prep_favorites(id, title, created_at, shopify_product_id, image_url, product_url, handle)",
      )
      .order("appointment_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      return serverError("Could not list sessions");
    }

    const sessions = (data || []).map((row) => {
      const favoriteRows = row.dress_prep_favorites as
        | {
            id: string;
            title: string;
            created_at: string;
            shopify_product_id: string;
            image_url: string | null;
            product_url: string | null;
            handle: string | null;
          }[]
        | null
        | undefined;
      const favorites = (favoriteRows || [])
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))
        .map((favorite) => ({
          id: favorite.id,
          title: favorite.title,
          shopify_product_id: favorite.shopify_product_id,
          image_url: favorite.image_url,
          product_url: favorite.product_url,
          handle: favorite.handle,
        }));
      const favoriteCount = favorites.length;
      const maxFavoriteAt = favoriteRows?.reduce((max, favorite) => {
        const time = new Date(favorite.created_at).getTime();
        return Number.isFinite(time) && time > max ? time : max;
      }, 0);
      const { dress_prep_favorites: favoritesRelation, ...session } = row;
      void favoritesRelation;
      const sessionUpdated = new Date(
        session.updated_at ?? session.created_at,
      ).getTime();
      const lastUpdatedMs = Math.max(sessionUpdated, maxFavoriteAt ?? 0);

      return {
        ...session,
        favorite_count: favoriteCount,
        last_updated_at: new Date(lastUpdatedMs).toISOString(),
        favorites,
      };
    });

    return NextResponse.json({ sessions });
  } catch {
    return serverError("Could not list sessions");
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireStaffAuth();
    if (unauthorized) return unauthorized;

    const body = await readJsonBody<{
      clientName?: string;
      appointmentAt?: string | null;
    }>(request);
    if (!body) return badRequest("Invalid request body");

    const clientName = (body.clientName || "").trim();
    if (!clientName) {
      return badRequest("Name is required");
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("dress_prep_sessions")
      .insert({
        client_name: clientName,
        appointment_at: body.appointmentAt || null,
      })
      .select("*")
      .single();

    if (error) {
      return serverError("Could not create session");
    }

    return NextResponse.json({ session: data });
  } catch {
    return serverError("Could not create session");
  }
}

export async function PATCH(request: Request) {
  try {
    const unauthorized = await requireStaffAuth();
    if (unauthorized) return unauthorized;

    const body = await readJsonBody<{
      id?: string;
      appointmentAt?: string | null;
      /** When present, replaces said-yes dress fields (null clears dress). */
      saidYesDress?: {
        shopifyProductId?: string | null;
        title?: string | null;
        handle?: string | null;
        imageUrl?: string | null;
        productUrl?: string | null;
      } | null;
      /** YYYY-MM-DD; null clears. Omit to leave unchanged. */
      estimatedArrivalOn?: string | null;
    }>(request);
    if (!body) return badRequest("Invalid request body");

    const id = (body.id || "").trim();
    if (!id) {
      return badRequest("Session id is required");
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if ("appointmentAt" in body) {
      updates.appointment_at = body.appointmentAt ?? null;
    }

    if ("saidYesDress" in body) {
      const dress = body.saidYesDress;
      if (dress == null) {
        updates.said_yes_shopify_product_id = null;
        updates.said_yes_title = null;
        updates.said_yes_handle = null;
        updates.said_yes_image_url = null;
        updates.said_yes_product_url = null;
      } else {
        const title = (dress.title || "").trim();
        updates.said_yes_shopify_product_id =
          (dress.shopifyProductId || "").trim() || null;
        updates.said_yes_title = title || null;
        updates.said_yes_handle = (dress.handle || "").trim() || null;
        updates.said_yes_image_url = (dress.imageUrl || "").trim() || null;
        updates.said_yes_product_url = (dress.productUrl || "").trim() || null;
      }
    }

    if ("estimatedArrivalOn" in body) {
      const raw = body.estimatedArrivalOn;
      if (raw == null || String(raw).trim() === "") {
        updates.estimated_arrival_on = null;
      } else {
        const day = String(raw).trim().slice(0, 10);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
          return badRequest("Arrival date must be YYYY-MM-DD");
        }
        updates.estimated_arrival_on = day;
      }
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("dress_prep_sessions")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return serverError("Could not update session");
    }

    return NextResponse.json({ session: data });
  } catch {
    return serverError("Could not update session");
  }
}

export async function DELETE(request: Request) {
  try {
    const unauthorized = await requireStaffAuth();
    if (unauthorized) return unauthorized;

    const body = await readJsonBody<{ id?: string }>(request);
    if (!body) return badRequest("Invalid request body");

    const id = (body.id || "").trim();
    if (!id) {
      return badRequest("Session id is required");
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from("dress_prep_sessions")
      .delete()
      .eq("id", id);

    if (error) {
      return serverError("Could not delete session");
    }

    return NextResponse.json({ ok: true });
  } catch {
    return serverError("Could not delete session");
  }
}
