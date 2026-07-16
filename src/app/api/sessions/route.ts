import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { requireStaffAuth } from "@/lib/staff-auth";

export async function GET() {
  try {
    const unauthorized = await requireStaffAuth();
    if (unauthorized) return unauthorized;

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("dress_prep_sessions")
      .select("*, dress_prep_favorites(created_at)")
      .order("appointment_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const sessions = (data || []).map((row) => {
      const favoriteRows = row.dress_prep_favorites as
        | { created_at: string }[]
        | null
        | undefined;
      const favoriteCount = favoriteRows?.length ?? 0;
      const maxFavoriteAt = favoriteRows?.reduce((max, favorite) => {
        const time = new Date(favorite.created_at).getTime();
        return Number.isFinite(time) && time > max ? time : max;
      }, 0);
      const { dress_prep_favorites: _favorites, ...session } = row;
      const sessionUpdated = new Date(
        session.updated_at ?? session.created_at,
      ).getTime();
      const lastUpdatedMs = Math.max(sessionUpdated, maxFavoriteAt ?? 0);

      return {
        ...session,
        favorite_count: favoriteCount,
        last_updated_at: new Date(lastUpdatedMs).toISOString(),
      };
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "List sessions failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const unauthorized = await requireStaffAuth();
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as {
      clientName?: string;
      appointmentAt?: string | null;
    };

    const clientName = (body.clientName || "").trim();
    if (!clientName) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Create session failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const unauthorized = await requireStaffAuth();
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as {
      id?: string;
      appointmentAt?: string | null;
    };

    const id = (body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Session id is required" }, { status: 400 });
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session: data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Update session failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const unauthorized = await requireStaffAuth();
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as { id?: string };
    const id = (body.id || "").trim();
    if (!id) {
      return NextResponse.json({ error: "Session id is required" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();
    const { error } = await supabase
      .from("dress_prep_sessions")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Delete session failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
