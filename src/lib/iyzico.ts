/**
 * iyzico Checkout Form — canlı site + satıcı onayı sonrası doldurulacak.
 * Şimdilik tip sözleşmesi ve yapılandırma iskeleti.
 */

export type IyzicoConfig = {
  apiKey: string;
  secretKey: string;
  baseUrl: 'https://sandbox-api.iyzipay.com' | 'https://api.iyzipay.com';
};

export type IyzicoCheckoutRequest = {
  packageId: string;
  price: number;
  currency: 'TRY';
  buyerEmail: string;
  buyerName: string;
  conversationId: string;
  callbackUrl: string;
};

export type IyzicoCheckoutResult =
  | { ok: true; token: string; paymentPageUrl: string }
  | { ok: false; error: string };

/** Ortamda anahtar yoksa entegrasyon kapalı kabul edilir. */
export function isIyzicoConfigured(): boolean {
  return Boolean(
    import.meta.env.VITE_IYZICO_API_KEY &&
      import.meta.env.VITE_IYZICO_SECRET_KEY &&
      import.meta.env.VITE_IYZICO_ENABLED === 'true',
  );
}

/**
 * Gerçek API çağrısı sunucu tarafında (Edge Function) olmalı — secret key tarayıcıya konmaz.
 * Bu fonksiyon istemciden yalnızca “hazır mı?” kontrolü ve ileride proxy çağrısı için yer tutar.
 */
export async function startIyzicoCheckout(
  _req: IyzicoCheckoutRequest,
): Promise<IyzicoCheckoutResult> {
  if (!isIyzicoConfigured()) {
    return {
      ok: false,
      error: 'iyzico henüz etkin değil. Canlı site onayı sonrası bağlanacak.',
    };
  }
  return {
    ok: false,
    error: 'iyzico proxy (Edge Function) henüz deploy edilmedi.',
  };
}
