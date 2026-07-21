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
      .select("*, dress_prep_favorites(id, title, created_at)")
      .order("appointment_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      return serverError("Could not list sessions");
    }

    const sessions = (data || []).map((row) => {
      const favoriteRows = row.dress_prep_favorites as
        | { id: string; title: string; created_at: string }[]
        | null
        | undefined;
      const favorites = (favoriteRows || [])
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }))
        .map((favorite) => ({
          id: favorite.id,
          title: favorite.title,
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
    }>(request);
    if (!body) return badRequest("Invalid request body");

    const id = (body.id || "").trim();
    if (!id) {
      return badRequest("Session id is required");
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("dress_prep_sessions")
      .update({
        appointment_at: body.appointmentAt ?? null,
        updated_at: new Date().toISOString(),
      })
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
