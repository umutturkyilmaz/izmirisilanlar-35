import supabase from '@/lib/supabase';

export type EmailKind =
  | 'contact_ack'
  | 'application_received'
  | 'application_status'
  | 'payment_receipt'
  | 'password_reset'
  | 'generic';

export type EnqueueEmailInput = {
  to: string;
  subject: string;
  body: string;
  kind?: EmailKind;
  meta?: Record<string, unknown>;
};

/**
 * E-postayı Supabase `email_queue` tablosuna yazar.
 * Gerçek gönderim (Resend/SendGrid) Edge Function / worker ile yapılır.
 */
export async function enqueueEmail(input: EnqueueEmailInput): Promise<{ ok: boolean; error?: string }> {
  const to = input.to.trim();
  if (!to || !input.subject.trim() || !input.body.trim()) {
    return { ok: false, error: 'Eksik alan' };
  }

  try {
    const { error } = await supabase.from('email_queue').insert({
      to_email: to,
      subject: input.subject.trim(),
      body: input.body.trim(),
      kind: input.kind ?? 'generic',
      meta: input.meta ?? {},
      status: 'pending',
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Kuyruk hatası' };
  }
}
