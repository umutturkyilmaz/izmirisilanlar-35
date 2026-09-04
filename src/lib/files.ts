import { getToken } from '@/lib/api';

/** Auth gerektiren /api/files/... linklerini token ile açar */
export async function openAuthedFile(url: string) {
  if (!url) throw new Error('Dosya yok');
  if (!url.includes('/api/files/')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  const token = getToken();
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  const blob = await res.blob();
  const obj = URL.createObjectURL(blob);
  window.open(obj, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(obj), 60_000);
}
