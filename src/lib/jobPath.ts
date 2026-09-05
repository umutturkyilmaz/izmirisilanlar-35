/** SEO dostu path: slug varsa onu, yoksa id */
export function jobPath(job: { id?: string | null; slug?: string | null } | null | undefined, suffix = '') {
  const key = String(job?.slug || job?.id || '')
    .trim();
  if (!key) return `/ilanlar${suffix}`;
  return `/ilan/${key}${suffix}`;
}

export function jobEditPath(
  job: { id?: string | null; slug?: string | null } | null | undefined,
  fromAdmin = false,
) {
  const q = fromAdmin ? '?from=admin' : '';
  const base = jobPath(job);
  if (base === '/ilanlar') return `/ilanlar${q}`;
  return `${base}/duzenle${q}`;
}
