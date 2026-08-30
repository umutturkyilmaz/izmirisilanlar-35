import { isApiConfigured } from '@/lib/api';

export default function ConfigBanner() {
  if (isApiConfigured) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[100] bg-amber-600 text-white text-sm px-4 py-3 text-center shadow-lg"
      role="status"
    >
      API bağlantısı yok. Railway’de MySQL + API servisini kurup site Variables’a{' '}
      <code className="mx-1">VITE_PUBLIC_API_URL</code> ekleyin, Redeploy edin.
    </div>
  );
}
