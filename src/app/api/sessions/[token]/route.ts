import { NextResponse } from "next/server";
import {
  resolveSessionByToken,
  sanitizeSessionForRole,
} from "@/lib/session-auth";
import { createSupabaseAdmin } from "@/lib/supabase";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const resolved = await resolveSessionByToken(token);

    if (!resolved) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const supabase = createSupabaseAdmin();
    const { data: favorites, error: favError } = await supabase
      .from("dress_prep_favorites")
      .select("*")
      .eq("session_id", resolved.session.id)
      .order("created_at", { ascending: true });

    if (favError) {
      return NextResponse.json({ error: favError.message }, { status: 500 });
    }

    return NextResponse.json({
      session: sanitizeSessionForRole(resolved.session, resolved.role),
      favorites: favorites || [],
      role: resolved.role,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Load session failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
