// Centralized Supabase client (reads from environment)
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database-types-fix';

// Read env at build-time (Vite-style). Provide safe fallback to avoid hard failures
const V = (import.meta as any).env || {};
// Runtime overrides (optional) via window for environments that inject at runtime
const RUNTIME_URL = typeof window !== 'undefined' ? (window as any).__SUPABASE_URL : undefined;
const RUNTIME_KEY = typeof window !== 'undefined' ? (window as any).__SUPABASE_ANON_KEY : undefined;

export const SUPABASE_URL = (V.VITE_SUPABASE_URL as string | undefined) || RUNTIME_URL || 'https://trlklwixfeaexhydzaue.supabase.co';
export const SUPABASE_ANON_KEY = (V.VITE_SUPABASE_ANON_KEY as string | undefined) || RUNTIME_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRybGtsd2l4ZmVhZXhoeWR6YXVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE0MTgsImV4cCI6MjA2ODI4NzQxOH0.6p52MXnM2UE0UfiD5ZDDkHWWuR0xcSmqJ85P4xuBd4M';

if (!V.VITE_SUPABASE_URL || !V.VITE_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[Supabase] Missing VITE_* env vars; using fallback keys. Configure env for production.');
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  // Only send the apikey by default. Let supabase-js set Authorization to the user access token when available.
  global: {
    headers: {
      apikey: SUPABASE_ANON_KEY,
    },
  },
});