import { api } from '@/lib/api';

export async function enqueueEmail(_input: {
  to: string;
  subject: string;
  body: string;
  kind?: string;
  meta?: Record<string, unknown>;
}): Promise<{ ok: boolean; error?: string }> {
  // E-posta kuyruğu sonraki aşama; şimdilik no-op başarı
  return { ok: true };
}

export async function expireOutdatedJobs(): Promise<number> {
  try {
    const data = await api<{ updated: number }>('/api/jobs/expire', { method: 'POST', body: {}, auth: false });
    return data.updated || 0;
  } catch {
    return 0;
  }
}
