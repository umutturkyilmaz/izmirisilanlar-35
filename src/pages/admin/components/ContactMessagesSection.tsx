import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type ContactRow = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  created_at: string;
};

export default function ContactMessagesSection() {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<ContactRow[]>('/api/admin/contact');
      setRows(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mesajlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <p className="text-sm text-foreground-500 py-8 text-center">Yükleniyor...</p>;
  }
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button type="button" onClick={() => void load()} className="text-sm text-primary-600 hover:underline">
          Tekrar dene
        </button>
      </div>
    );
  }
  if (!rows.length) {
    return <p className="text-sm text-foreground-500 py-8 text-center">Henüz iletişim mesajı yok.</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.id} className="rounded-xl border border-background-200 bg-background-50 overflow-hidden">
          <button
            type="button"
            className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-background-100/80"
            onClick={() => setOpenId((id) => (id === r.id ? null : r.id))}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground-950 truncate">{r.subject || '(Konu yok)'}</p>
              <p className="text-xs text-foreground-500 mt-0.5">
                {r.name} · {r.email} ·{' '}
                {new Date(r.created_at).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <i className={`ri-arrow-${openId === r.id ? 'up' : 'down'}-s-line text-foreground-400 shrink-0`} />
          </button>
          {openId === r.id && (
            <div className="px-4 pb-4 text-sm text-foreground-700 whitespace-pre-wrap border-t border-background-100 pt-3">
              {r.message}
              <div className="mt-3">
                <a href={`mailto:${r.email}`} className="text-primary-600 hover:underline text-xs font-medium">
                  Yanıtla: {r.email}
                </a>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
