import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requireSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }
  return url;
}

/** Server-only client. Bypasses RLS — use only in API routes after authorization checks. */
export function createSupabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(requireSupabaseUrl(), key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
