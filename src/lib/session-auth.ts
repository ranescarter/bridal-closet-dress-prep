import { createSupabaseAdmin } from "@/lib/supabase";
import type { DressPrepSession } from "@/lib/types";

export type SessionRole = "client" | "staff";

export type ResolvedSession = {
  session: DressPrepSession;
  role: SessionRole;
};

export async function resolveSessionByToken(
  token: string,
): Promise<ResolvedSession | null> {
  const supabase = createSupabaseAdmin();

  const { data: byClient, error: clientError } = await supabase
    .from("dress_prep_sessions")
    .select("*")
    .eq("client_token", token)
    .maybeSingle();

  if (clientError) {
    throw new Error(clientError.message);
  }

  if (byClient) {
    return { session: byClient, role: "client" };
  }

  const { data: byFamily, error: familyError } = await supabase
    .from("dress_prep_sessions")
    .select("*")
    .eq("staff_token", token)
    .maybeSingle();

  if (familyError) {
    throw new Error(familyError.message);
  }

  if (!byFamily) {
    return null;
  }

  return { session: byFamily, role: "staff" };
}

/** Family/read-only links must never receive the bride token. */
export function sanitizeSessionForRole(
  session: DressPrepSession,
  role: SessionRole,
): DressPrepSession {
  if (role === "client") {
    return session;
  }

  return {
    ...session,
    client_token: "",
  };
}

export async function requireClientSession(token: string): Promise<DressPrepSession> {
  const resolved = await resolveSessionByToken(token);
  if (!resolved) {
    throw new SessionAccessError("Session not found", 404);
  }
  if (resolved.role !== "client") {
    throw new SessionAccessError(
      "Only the bride link can make this change",
      403,
    );
  }
  return resolved.session;
}

export async function touchSession(sessionId: string) {
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("dress_prep_sessions")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
}

export class SessionAccessError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
