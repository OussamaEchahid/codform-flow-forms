import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Minimal helper to call Edge Functions via GET with anon auth header
 */
export async function edgeGet<T = any>(name: string, params?: Record<string, string | number | undefined | null>): Promise<{ status: number; data: T | null; error?: string }>{
  const url = new URL(`${SUPABASE_URL}/functions/v1/${name}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const text = await res.text();
  try {
    const json = text ? JSON.parse(text) : null;
    return { status: res.status, data: json };
  } catch {
    return { status: res.status, data: null, error: text };
  }
}
