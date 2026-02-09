import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client with the service role key.
 * Use this for server-side writes that bypass RLS (request_logs, transcripts).
 * NEVER expose this client to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
