// Centralized Supabase client (reads from environment)
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database-types-fix';

// Read env at build-time (Vite-style). Fail fast if missing.
export const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
export const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Stop early to avoid leaking hard-coded keys or hitting wrong project
  const msg = 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment';
  // eslint-disable-next-line no-console
  console.error(`[Supabase] ${msg}`);
  throw new Error(msg);
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});