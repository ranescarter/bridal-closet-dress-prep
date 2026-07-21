import { NextResponse } from "next/server";
import {
  resolveSessionByToken,
  sanitizeSessionForRole,
} from "@/lib/session-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import { serverError } from "@/lib/http";

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
      return serverError("Could not load session");
    }

    return NextResponse.json({
      session: sanitizeSessionForRole(resolved.session, resolved.role),
      favorites: favorites || [],
      role: resolved.role,
    });
  } catch {
    return serverError("Could not load session");
  }
}
