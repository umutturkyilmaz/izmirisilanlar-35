import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { uploadUserFile } from '@/lib/storage';
import { useAuth } from '@/hooks/useAuth';

export type AdPlacement = 'home' | 'jobs_list' | 'job_detail';

type AdRow = {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
  placement: AdPlacement;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

const PLACEMENT_LABELS: Record<AdPlacement, string> = {
  home: 'Ana sayfa',
  jobs_list: 'İlan listesi',
  job_detail: 'İlan detay',
};

const emptyForm = {
  title: '',
  image_url: '',
  link_url: '',
  placement: 'home' as AdPlacement,
  is_active: true,
  sort_order: '0',
  starts_at: '',
  ends_at: '',
};

function toDatetimeLocal(v: string | null) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdsSection() {
  const { user } = useAuth();
  const [rows, setRows] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<AdRow[]>('/api/admin/ads');
      setRows(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reklamlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (ad: AdRow) => {
    setEditingId(ad.id);
    setForm({
      title: ad.title,
      image_url: ad.image_url,
      link_url: ad.link_url,
      placement: ad.placement,
      is_active: ad.is_active,
      sort_order: String(ad.sort_order ?? 0),
      starts_at: toDatetimeLocal(ad.starts_at),
      ends_at: toDatetimeLocal(ad.ends_at),
    });
    setMsg(null);
  };

  const onUpload = async (file: File | null) => {
    if (!file || !user) return;
    setUploading(true);
    setMsg(null);
    try {
      const uploaded = await uploadUserFile('job-images', user.id, file);
      if (uploaded.error || !uploaded.url) throw new Error(uploaded.error || 'Yükleme başarısız');
      setForm((f) => ({ ...f, image_url: uploaded.url! }));
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Görsel yüklenemedi');
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const body = {
        title: form.title.trim(),
        image_url: form.image_url.trim(),
        link_url: form.link_url.trim(),
        placement: form.placement,
        is_active: form.is_active,
        sort_order: Number(form.sort_order) || 0,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      };
      if (editingId) {
        await api(`/api/admin/ads/${editingId}`, { method: 'PATCH', body });
        setMsg('Reklam güncellendi.');
      } else {
        await api('/api/admin/ads', { method: 'POST', body });
        setMsg('Reklam eklendi.');
      }
      resetForm();
      await load();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Kayıt başarısız');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ad: AdRow) => {
    await api(`/api/admin/ads/${ad.id}`, {
      method: 'PATCH',
      body: { is_active: !ad.is_active },
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm('Reklam silinsin mi?')) return;
    await api(`/api/admin/ads/${id}`, { method: 'DELETE' });
    if (editingId === id) resetForm();
    await load();
  };

  const field =
    'w-full px-3 py-2 rounded-lg border border-background-300 bg-background-50 text-foreground-950 text-sm';

  return (
    <div className="space-y-6">
      <form
        onSubmit={save}
        className="rounded-xl border border-background-200 bg-background-50 dark:bg-background-100 p-4 md:p-5 space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading font-semibold text-base text-foreground-950">
            {editingId ? 'Reklamı düzenle' : 'Yeni reklam'}
          </h3>
          {editingId && (
            <button type="button" onClick={resetForm} className="text-xs text-foreground-500 hover:underline">
              İptal
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground-800">Başlık</label>
            <input
              className={field}
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Örn. Sponsor banner"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground-800">Yerleşim</label>
            <select
              className={field}
              value={form.placement}
              onChange={(e) => setForm({ ...form, placement: e.target.value as AdPlacement })}
            >
              {(Object.keys(PLACEMENT_LABELS) as AdPlacement[]).map((k) => (
                <option key={k} value={k}>
                  {PLACEMENT_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-foreground-800">Link (https://…)</label>
          <input
            className={field}
            required
            type="url"
            value={form.link_url}
            onChange={(e) => setForm({ ...form, link_url: e.target.value })}
            placeholder="https://ornek.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-foreground-800">Görsel</label>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            {form.image_url ? (
              <img
                src={form.image_url}
                alt=""
                className="w-full sm:w-48 h-24 object-cover rounded-lg border border-background-200"
              />
            ) : (
              <div className="w-full sm:w-48 h-24 rounded-lg border border-dashed border-background-300 flex items-center justify-center text-xs text-foreground-400">
                Önizleme
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="block w-full text-sm text-foreground-800"
                disabled={uploading || !user}
                onChange={(e) => void onUpload(e.target.files?.[0] || null)}
              />
              <input
                className={field}
                required
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                placeholder="veya görsel URL yapıştır"
              />
              {uploading && <p className="text-xs text-foreground-500">Yükleniyor…</p>}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground-800">Sıra</label>
            <input
              className={field}
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground-800">Başlangıç (ops.)</label>
            <input
              className={field}
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-foreground-800">Bitiş (ops.)</label>
            <input
              className={field}
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-foreground-800 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Aktif
        </label>

        {msg && <p className="text-sm text-foreground-700">{msg}</p>}

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium disabled:opacity-60"
        >
          {saving ? 'Kaydediliyor…' : editingId ? 'Güncelle' : 'Ekle'}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-foreground-500 py-6 text-center">Yükleniyor...</p>
      ) : error ? (
        <div className="text-center py-6">
          <p className="text-sm text-red-600 mb-3">{error}</p>
          <button type="button" onClick={() => void load()} className="text-sm text-primary-600 hover:underline">
            Tekrar dene
          </button>
        </div>
      ) : !rows.length ? (
        <p className="text-sm text-foreground-500 py-6 text-center">Henüz reklam yok.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((ad) => (
            <div
              key={ad.id}
              className="rounded-xl border border-background-200 bg-background-50 dark:bg-background-100 p-3 flex flex-col sm:flex-row gap-3"
            >
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full sm:w-40 h-20 object-cover rounded-lg border border-background-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground-950 truncate">{ad.title}</p>
                <p className="text-xs text-foreground-500 mt-0.5">
                  {PLACEMENT_LABELS[ad.placement] || ad.placement} · sıra {ad.sort_order} ·{' '}
                  {ad.is_active ? 'aktif' : 'pasif'}
                </p>
                <a
                  href={ad.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline break-all"
                >
                  {ad.link_url}
                </a>
                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(ad)}
                    className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(ad)}
                    className="text-xs font-medium text-foreground-600 hover:underline"
                  >
                    {ad.is_active ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(ad.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
