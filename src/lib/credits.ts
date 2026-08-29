import supabase from '@/lib/supabase';
import { getPackageById } from '@/data/packages';

export interface EmployerCredit {
  id: string;
  packageId: string;
  packageName: string;
  durationDays: number;
  featured: boolean;
  remaining: number;
  purchasedAt: string;
}

type CreditRow = {
  id: string;
  package_id: string;
  package_name: string;
  duration_days: number;
  featured: boolean;
  remaining: number;
  created_at: string;
};

function mapRow(row: CreditRow): EmployerCredit {
  return {
    id: row.id,
    packageId: row.package_id,
    packageName: row.package_name,
    durationDays: row.duration_days,
    featured: row.featured,
    remaining: row.remaining,
    purchasedAt: row.created_at,
  };
}

/** localStorage yedek (şema henüz uygulanmadıysa) */
const keyFor = (userId: string) => `employer_credits_${userId}`;

function getLocalCredits(userId: string): EmployerCredit[] {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    return raw ? (JSON.parse(raw) as EmployerCredit[]) : [];
  } catch {
    return [];
  }
}

function saveLocalCredits(userId: string, credits: EmployerCredit[]) {
  localStorage.setItem(keyFor(userId), JSON.stringify(credits));
}

export async function fetchCredits(userId: string): Promise<EmployerCredit[]> {
  const { data, error } = await supabase
    .from('employer_credits')
    .select('id, package_id, package_name, duration_days, featured, remaining, created_at')
    .eq('employer_id', userId)
    .gt('remaining', 0)
    .order('created_at', { ascending: true });

  if (error) {
    return getLocalCredits(userId).filter((c) => c.remaining > 0);
  }
  return (data as CreditRow[]).map(mapRow);
}

export async function addCreditsFromPackage(
  userId: string,
  packageId: string,
  paymentMeta?: {
    amount: number;
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
    companyName?: string;
    taxId?: string;
    address?: string;
  }
): Promise<EmployerCredit | null> {
  const pkg = getPackageById(packageId);
  if (!pkg) return null;

  let paymentId: string | null = null;
  const { data: payment, error: payErr } = await supabase
    .from('job_payments')
    .insert({
      employer_id: userId,
      package_id: pkg.id,
      package_name: pkg.name,
      amount: paymentMeta?.amount ?? pkg.price,
      currency: 'TRY',
      status: 'awaiting_iyzico',
      buyer_name: paymentMeta?.buyerName || null,
      buyer_email: paymentMeta?.buyerEmail || null,
      buyer_phone: paymentMeta?.buyerPhone || null,
      company_name: paymentMeta?.companyName || null,
      tax_id: paymentMeta?.taxId || null,
      billing_address: paymentMeta?.address || null,
    })
    .select('id')
    .maybeSingle();

  if (!payErr && payment?.id) paymentId = payment.id as string;

  const rows =
    packageId === 'kurumsal'
      ? [
          {
            employer_id: userId,
            payment_id: paymentId,
            package_id: pkg.id,
            package_name: `${pkg.name} (Standart hak)`,
            duration_days: pkg.durationDays,
            featured: false,
            remaining: 3,
          },
          {
            employer_id: userId,
            payment_id: paymentId,
            package_id: pkg.id,
            package_name: `${pkg.name} (Öne çıkan hak)`,
            duration_days: pkg.durationDays,
            featured: true,
            remaining: 2,
          },
        ]
      : [
          {
            employer_id: userId,
            payment_id: paymentId,
            package_id: pkg.id,
            package_name: pkg.name,
            duration_days: pkg.durationDays,
            featured: packageId === 'one-cikan',
            remaining: 1,
          },
        ];

  const { data: inserted, error } = await supabase
    .from('employer_credits')
    .insert(rows)
    .select('id, package_id, package_name, duration_days, featured, remaining, created_at');

  if (error || !inserted?.length) {
    // Fallback local
    const localBatch: EmployerCredit[] = rows.map((r, idx) => ({
      id: `local_${Date.now()}_${idx}`,
      packageId: r.package_id,
      packageName: r.package_name,
      durationDays: r.duration_days,
      featured: r.featured,
      remaining: r.remaining,
      purchasedAt: new Date().toISOString(),
    }));
    saveLocalCredits(userId, [...getLocalCredits(userId), ...localBatch]);
    return localBatch[0];
  }

  return mapRow(inserted[0] as CreditRow);
}

export async function consumeCredit(
  userId: string,
  creditId: string
): Promise<EmployerCredit | null> {
  if (creditId.startsWith('local_')) {
    const credits = getLocalCredits(userId);
    const idx = credits.findIndex((c) => c.id === creditId && c.remaining > 0);
    if (idx === -1) return null;
    const used = { ...credits[idx], remaining: credits[idx].remaining - 1 };
    credits[idx] = used;
    saveLocalCredits(userId, credits);
    return used;
  }

  const { data: current, error: readErr } = await supabase
    .from('employer_credits')
    .select('id, package_id, package_name, duration_days, featured, remaining, created_at')
    .eq('id', creditId)
    .eq('employer_id', userId)
    .maybeSingle();

  if (readErr || !current || (current as CreditRow).remaining <= 0) return null;

  const nextRemaining = (current as CreditRow).remaining - 1;
  const { data: updated, error } = await supabase
    .from('employer_credits')
    .update({ remaining: nextRemaining })
    .eq('id', creditId)
    .eq('employer_id', userId)
    .select('id, package_id, package_name, duration_days, featured, remaining, created_at')
    .maybeSingle();

  if (error || !updated) return null;
  return mapRow(updated as CreditRow);
}

export async function totalRemaining(userId: string): Promise<number> {
  const list = await fetchCredits(userId);
  return list.reduce((sum, c) => sum + c.remaining, 0);
}
