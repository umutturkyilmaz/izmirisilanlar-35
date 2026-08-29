import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import supabase from '@/lib/supabase';

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
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    (async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, title, description, city, salary_min, salary_max, employer_id')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) {
        setLoadErr('İlan bulunamadı.');
        return;
      }
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
    })();
  }, [id, user, profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    if (form.title.trim().length < 5 || form.description.trim().length < 50) {
      setMsg('Başlık en az 5, açıklama en az 50 karakter olmalı.');
      return;
    }
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from('jobs')
      .update({
        title: form.title.trim(),
        description: form.description.trim(),
        city: form.city.trim() || null,
        salary_min: form.salary_min ? parseInt(form.salary_min, 10) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max, 10) : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('employer_id', user.id);
    setSaving(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg('İlan güncellendi.');
    setTimeout(() => navigate('/profil/isveren'), 1200);
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
                    type="number"
                    className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm"
                    value={form.salary_min}
                    onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Max maaş</label>
                  <input
                    type="number"
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
                  className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm resize-none"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              {msg && <p className="text-sm text-foreground-700">{msg}</p>}
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold disabled:opacity-60"
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
