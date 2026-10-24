import { useState } from 'react';
import { api, getToken } from '@/lib/api';

const API_URL = (import.meta.env.VITE_PUBLIC_API_URL || '').replace(/\/$/, '');

export default function BackupPanel() {
  const [busy, setBusy] = useState<'download' | 'email' | 'test' | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const download = async () => {
    setBusy('download');
    setMsg(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/backup`, {
        headers: { Authorization: `Bearer ${getToken() || ''}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
      }
      const name =
        res.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/)?.[1] || 'yedek.json.gz';
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
      setMsg({ ok: true, text: 'Tam yedek indirildi (yüklenen dosyalar dahil).' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Yedek indirilemedi' });
    }
    setBusy(null);
  };

  const emailNow = async () => {
    setBusy('email');
    setMsg(null);
    try {
      const r = await api<{ message?: string }>('/api/admin/backup/email', { method: 'POST', body: {} });
      setMsg({ ok: true, text: r.message || 'Yedek gönderildi.' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Yedek gönderilemedi' });
    }
    setBusy(null);
  };

  const testMail = async () => {
    setBusy('test');
    setMsg(null);
    try {
      const r = await api<{ message?: string }>('/api/admin/mail-test', { method: 'POST', body: {} });
      setMsg({ ok: true, text: r.message || 'Test e-postası gönderildi.' });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Test başarısız' });
    }
    setBusy(null);
  };

  return (
    <div className="mb-6 rounded-xl border border-background-200 bg-background-50 dark:bg-background-100 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-semibold text-sm text-foreground-950">Veritabanı yedeği</p>
          <p className="text-xs text-foreground-500">
            Her gün otomatik olarak e-postanıza gönderilir. İstediğiniz an indirebilirsiniz.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void download()}
            className="px-3 py-2 rounded-lg bg-primary-600 text-white text-xs font-semibold disabled:opacity-50"
          >
            {busy === 'download' ? 'Hazırlanıyor…' : 'Yedeği indir'}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void emailNow()}
            className="px-3 py-2 rounded-lg border border-background-300 text-xs font-semibold disabled:opacity-50"
          >
            {busy === 'email' ? 'Gönderiliyor…' : 'Şimdi e-postala'}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void testMail()}
            className="px-3 py-2 rounded-lg border border-background-300 text-xs font-semibold disabled:opacity-50"
          >
            {busy === 'test' ? 'Test ediliyor…' : 'E-posta testi'}
          </button>
        </div>
      </div>
      {msg && (
        <p className={`mt-3 text-xs ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.text}</p>
      )}
    </div>
  );
}
