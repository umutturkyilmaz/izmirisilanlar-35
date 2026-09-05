import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';

type ContactRow = {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read?: boolean;
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

  const markRead = async (id: string) => {
    await api(`/api/admin/contact/${id}/read`, { method: 'PATCH', body: {} });
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_read: true } : r)));
  };

  const remove = async (id: string) => {
    if (!confirm('Mesaj silinsin mi?')) return;
    await api(`/api/admin/contact/${id}`, { method: 'DELETE' });
    setRows((prev) => prev.filter((r) => r.id !== id));
    setOpenId(null);
  };

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
        <div
          key={r.id}
          className={`rounded-xl border overflow-hidden ${
            r.is_read ? 'border-background-200 bg-background-50' : 'border-primary-200 bg-primary-50/30'
          }`}
        >
          <button
            type="button"
            className="w-full text-left px-4 py-3 flex items-start justify-between gap-3 hover:bg-background-100/80"
            onClick={() => {
              setOpenId((id) => (id === r.id ? null : r.id));
              if (!r.is_read) void markRead(r.id);
            }}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground-950 truncate">
                {!r.is_read && <span className="inline-block w-2 h-2 rounded-full bg-primary-500 mr-2" />}
                {r.subject || '(Konu yok)'}
              </p>
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
              <div className="mt-3 flex flex-wrap gap-3">
                <a href={`mailto:${r.email}`} className="text-primary-600 hover:underline text-xs font-medium">
                  Yanıtla: {r.email}
                </a>
                <button
                  type="button"
                  onClick={() => void remove(r.id)}
                  className="text-xs text-red-600 hover:underline font-medium"
                >
                  Sil
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
