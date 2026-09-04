import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import JobImage from '@/components/feature/JobImage';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { uploadUserFile } from '@/lib/storage';

type JobEdit = {
  id: string;
  title: string;
  description: string;
  city: string | null;
  salary_min: number | null;
  salary_max: number | null;
  employer_id: string;
  image_url: string | null;
};

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    city: '',
    salary_min: '',
    salary_max: '',
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      try {
        const data = await api<JobEdit>(`/api/jobs/${id}`);
        if (data.employer_id !== user.id && profile?.role !== 'admin') {
          setLoadErr('Bu ilanı düzenleme yetkiniz yok.');
          return;
        }
        setForm({
          title: data.title || '',
          description: data.description || '',
          city: data.city || '',
          salary_min: data.salary_min != null ? String(data.salary_min) : '',
          salary_max: data.salary_max != null ? String(data.salary_max) : '',
        });
        setImageUrl(data.image_url || null);
      } catch {
        setLoadErr('İlan bulunamadı.');
      }
    })();
  }, [id, user, profile]);

  useEffect(() => {
    if (!imageFile) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    if (form.title.trim().length < 5 || form.description.trim().length < 50) {
      setMsg('Başlık en az 5, açıklama en az 50 karakter olmalı.');
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      let nextImage = imageUrl;
      if (imageFile) {
        const uploaded = await uploadUserFile('job-images', user.id, imageFile);
        if (uploaded.error) throw new Error(uploaded.error);
        nextImage = uploaded.url;
      }
      await api(`/api/jobs/${id}`, {
        method: 'PATCH',
        body: {
          title: form.title.trim(),
          description: form.description.trim(),
          city: form.city.trim() || null,
          salary_min: form.salary_min ? parseInt(form.salary_min, 10) : null,
          salary_max: form.salary_max ? parseInt(form.salary_max, 10) : null,
          image_url: nextImage,
        },
      });
      setImageUrl(nextImage);
      setImageFile(null);
      setMsg('İlan güncellendi.');
      setTimeout(() => navigate(`/ilan/${id}`), 1000);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Güncelleme başarısız');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-foreground-500">Yükleniyor...</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <Link to="/profil/isveren" className="text-sm text-primary-600 hover:underline">
            ← İlanlarıma dön
          </Link>
          <h1 className="font-heading text-2xl font-bold mt-3 mb-6">İlanı Düzenle</h1>
          {loadErr ? (
            <p className="text-sm text-red-600">{loadErr}</p>
          ) : (
            <form onSubmit={save} className="space-y-4 bg-background-50 border border-background-200 rounded-xl p-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Görsel</label>
                <div className="flex items-start gap-4">
                  <div className="w-28 h-28 rounded-lg overflow-hidden border border-background-200 shrink-0">
                    <JobImage
                      src={preview || imageUrl}
                      alt="İlan görseli"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="block w-full text-sm"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-foreground-500 mt-1">JPG, PNG veya WebP — max 8 MB</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Başlık</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Şehir</label>
                <input
                  className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Min maaş</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm"
                    value={form.salary_min}
                    onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Max maaş</label>
                  <input
                    className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm"
                    value={form.salary_max}
                    onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Açıklama</label>
                <textarea
                  rows={8}
                  className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              {msg && <p className="text-sm text-foreground-700">{msg}</p>}
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-primary-500 text-white text-sm font-medium disabled:opacity-60"
              >
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
