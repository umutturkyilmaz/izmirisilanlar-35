/** SEO dostu path: slug varsa onu, yoksa id */
export function jobPath(job: { id: string; slug?: string | null }, suffix = '') {
  const key = (job.slug || job.id).trim();
  return `/ilan/${key}${suffix}`;
}

export function jobEditPath(job: { id: string; slug?: string | null }, fromAdmin = false) {
  const q = fromAdmin ? '?from=admin' : '';
  return `${jobPath(job)}/duzenle${q}`;
}
