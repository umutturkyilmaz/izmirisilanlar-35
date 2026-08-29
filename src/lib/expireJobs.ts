import supabase from '@/lib/supabase';

/** Aktif ama süresi geçmiş ilanları expired yapar. */
export async function expireOutdatedJobs(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('expire_outdated_jobs');
    if (!error && typeof data === 'number') return data;

    const now = new Date().toISOString();
    const { data: rows, error: selErr } = await supabase
      .from('jobs')
      .select('id')
      .eq('status', 'active')
      .lt('expires_at', now);

    if (selErr || !rows?.length) return 0;

    const ids = rows.map((r) => r.id);
    const { error: updErr } = await supabase
      .from('jobs')
      .update({ status: 'expired' })
      .in('id', ids);

    return updErr ? 0 : ids.length;
  } catch {
    return 0;
  }
}
