import { isSupabaseConfigured } from '@/lib/supabase';

/** Build’te gerçek Supabase yoksa kullanıcıya görünür uyarı (beyaz ekran yerine). */
export default function ConfigBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[100] bg-amber-600 text-white text-sm px-4 py-3 text-center shadow-lg"
      role="status"
    >
      Supabase ayarları eksik. Önce <code className="mx-1">supabase/full-setup.sql</code> çalıştırın;
      sonra Railway Variables’a gerçek{' '}
      <code className="mx-1">VITE_PUBLIC_SUPABASE_URL</code> ve{' '}
      <code className="mx-1">VITE_PUBLIC_SUPABASE_ANON_KEY</code> ekleyip Redeploy edin.
      Site arayüzü açılır; giriş/veri henüz çalışmaz.
    </div>
  );
}
