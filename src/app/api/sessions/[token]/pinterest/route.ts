import { NextResponse } from "next/server";
import {
  requireClientSession,
  SessionAccessError,
  touchSession,
} from "@/lib/session-auth";
import { createSupabaseAdmin } from "@/lib/supabase";
import { normalizePinterestUrlForSave } from "@/lib/pinterest";
import { badRequest, readJsonBody, serverError } from "@/lib/http";

type Params = { params: Promise<{ token: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const body = await readJsonBody<{ url?: string | null }>(request);
    if (!body) return badRequest("Invalid request body");

    const session = await requireClientSession(token);
    const raw = body.url;

    let pinterestUrl: string | null = null;
    const pinterestUpdatedAt: string | null = new Date().toISOString();

    if (raw == null || String(raw).trim() === "") {
      pinterestUrl = null;
    } else {
      const normalized = await normalizePinterestUrlForSave(String(raw));
      if (!normalized.ok) {
        return badRequest(normalized.error);
      }
      pinterestUrl = normalized.url;
    }

    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("dress_prep_sessions")
      .update({
        pinterest_url: pinterestUrl,
        pinterest_updated_at: pinterestUpdatedAt,
        updated_at: pinterestUpdatedAt,
      })
      .eq("id", session.id)
      .select("*")
      .single();

    if (error) {
      return serverError("Could not save Pinterest link");
    }

    await touchSession(session.id);

    return NextResponse.json({ session: data });
  } catch (error) {
    if (error instanceof SessionAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return serverError("Could not save Pinterest link");
  }
}
