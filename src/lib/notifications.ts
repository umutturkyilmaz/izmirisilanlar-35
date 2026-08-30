import { api } from '@/lib/api';

export async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  link?: string;
}) {
  try {
    await api('/api/notifications', {
      body: {
        user_id: input.userId,
        title: input.title,
        body: input.body,
        link: input.link,
      },
    });
  } catch {
    /* ignore */
  }
}

export async function listNotifications(_userId: string) {
  try {
    return await api<
      { id: string; title: string; body: string; link: string | null; read: boolean; created_at: string }[]
    >('/api/notifications');
  } catch {
    return [];
  }
}

export async function markNotificationRead(id: string) {
  try {
    await api(`/api/notifications/${id}/read`, { method: 'PATCH', body: {} });
  } catch {
    /* ignore */
  }
}
