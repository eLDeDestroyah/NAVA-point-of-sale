import { getSupabaseServerClient, getSupabaseBrowserClient } from "@/lib/supabase";

export async function getDbServer() {
  return getSupabaseServerClient();
}

export function getDbClient() {
  return getSupabaseBrowserClient();
}
