import { api } from '@/lib/api';

export type IyzicoStatus = {
  enabled: boolean;
  sandbox: boolean;
  message: string;
};

/** Sunucudan iyzico hazır mı? (secret key tarayıcıda asla yok) */
export async function fetchIyzicoStatus(): Promise<IyzicoStatus> {
  try {
    return await api<IyzicoStatus>('/api/payments/iyzico/status', { auth: false });
  } catch {
    return {
      enabled: false,
      sandbox: true,
      message: 'API yanıt vermedi',
    };
  }
}
