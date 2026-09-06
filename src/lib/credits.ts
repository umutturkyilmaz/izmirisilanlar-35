import { api } from '@/lib/api';
import { getPackageById } from '@/data/packages';

export type EmployerCredit = {
  id: string;
  package_id: string;
  package_name: string;
  duration_days: number;
  featured: boolean;
  remaining: number;
  created_at?: string;
};

export async function getAvailableCredits(_userId: string): Promise<EmployerCredit[]> {
  try {
    return await api<EmployerCredit[]>('/api/credits');
  } catch {
    return [];
  }
}

/** Alias for pages that still call fetchCredits(userId) */
export async function fetchCredits(userId: string): Promise<EmployerCredit[]> {
  return getAvailableCredits(userId);
}

export function totalRemaining(credits: EmployerCredit[]): number;
export function totalRemaining(userId: string): Promise<number>;
export function totalRemaining(
  creditsOrUserId: EmployerCredit[] | string,
): number | Promise<number> {
  if (typeof creditsOrUserId === 'string') {
    return getAvailableCredits(creditsOrUserId).then((list) =>
      list.reduce((s, c) => s + (c.remaining || 0), 0),
    );
  }
  return creditsOrUserId.reduce((s, c) => s + (c.remaining || 0), 0);
}

export async function consumeCredit(
  userIdOrCreditId: string,
  creditId?: string,
): Promise<(EmployerCredit & { durationDays: number }) | null> {
  // Sunucu kredi tüketimini yalnızca ilan oluşturma/yenileme ile yapar
  void userIdOrCreditId;
  void creditId;
  return null;
}

export async function addCreditsFromPackage(
  _userId: string,
  packageId: string,
  meta: {
    amount: number;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    companyName: string;
    taxId?: string;
    billingAddress?: string;
  },
) {
  const pkg = getPackageById(packageId);
  if (!pkg) throw new Error('Paket bulunamadı');
  return api<{
    mode: 'pending_admin' | 'iyzico' | 'test';
    payment_id: string;
    credit_id?: string;
    paymentPageUrl?: string;
    token?: string;
    message?: string;
  }>('/api/payments/checkout', {
    body: {
      package_id: pkg.id,
      buyer_name: meta.buyerName,
      buyer_email: meta.buyerEmail,
      buyer_phone: meta.buyerPhone,
      company_name: meta.companyName,
      tax_id: meta.taxId,
      billing_address: meta.billingAddress,
    },
  });
}
