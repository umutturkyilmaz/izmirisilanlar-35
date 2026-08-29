import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase ortam değişkenleri eksik. VITE_PUBLIC_SUPABASE_URL ve VITE_PUBLIC_SUPABASE_ANON_KEY değerlerini kendi supabase.co projenizden ayarlayın (.env.example).'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;