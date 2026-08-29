import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_PUBLIC_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '').trim();

const looksPlaceholder =
  !rawUrl ||
  !rawKey ||
  rawUrl.includes('YOUR_PROJECT') ||
  rawKey === 'your_supabase_anon_key' ||
  rawKey.length < 20;

/** Gerçek Supabase URL+key Railway Variables’ta yoksa false. */
export const isSupabaseConfigured = !looksPlaceholder;

const url = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const key = isSupabaseConfigured
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJwbGFjZWhvbGRlciJ9.placeholder';

export const supabase: SupabaseClient = createClient(url, key);

export default supabase;
