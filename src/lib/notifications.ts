import supabase from '@/lib/supabase';

export async function createNotification(input: {
  userId: string;
  title: string;
  body: string;
  link?: string;
}) {
  try {
    await supabase.from('notifications').insert({
      user_id: input.userId,
      title: input.title,
      body: input.body,
      link: input.link || null,
      read: false,
    });
  } catch {
    /* tablo yoksa sessiz */
  }
}

export async function fetchNotifications(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, link, read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return data || [];
}

export async function markNotificationRead(id: string) {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}
