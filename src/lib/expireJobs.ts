import { api } from '@/lib/api';

/** Süresi dolan ilanları API üzerinden kapat (cron / istemci tetik) */
export async function expireOutdatedJobs(): Promise<number> {
  try {
    const data = await api<{ updated: number }>('/api/jobs/expire', {
      method: 'POST',
      body: {},
      auth: false,
    });
    return data.updated || 0;
  } catch {
    return 0;
  }
}
