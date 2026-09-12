import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import JobImage from '@/components/feature/JobImage';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { uploadUserFile } from '@/lib/storage';
import { EXPERIENCE_OPTIONS, JOB_TYPE_OPTIONS, EDUCATION_OPTIONS, SALARY_TYPE_OPTIONS, parseSalaryInput } from '@/lib/jobLabels';

const STATUSES = [
  { value: 'active', label: 'Yayında' },
  { value: 'pending', label: 'Onay bekliyor' },
  { value: 'rejected', label: 'Reddedildi' },
  { value: 'closed', label: 'Kapalı' },
  { value: 'expired', label: 'Süresi doldu' },
];

type Category = { id: number; name: string };

type JobEdit = {
  id: string;
  title: string;
  description: string;
  city: string | null;
  company_name: string | null;
  sector: string | null;
  job_type: string | null;
  experience_level: string | null;
  education_level?: string | null;
  salary_type?: string | null;
  salary_min: number | null;
  salary_max: number | null;
  status: string;
  featured: boolean;
  employer_id: string;
  image_url: string | null;
  category_id: number | null;
  requirements: string[] | null;
  benefits: string[] | null;
};

export default function EditJobPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const isAdmin = profile?.role === 'admin';
  const fromAdmin = searchParams.get('from') === 'admin' || isAdmin;

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    city: '',
    company_name: '',
    sector: '',
    job_type: 'tam-zamanli',
    experience_level: 'her-seviye',
    education_level: 'farketmez',
    salary_type: 'range',
    salary_min: '',
    salary_max: '',
    status: 'active',
    featured: false,
    category_id: 0,
  });
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  useEffect(() => {
    api<Category[]>('/api/categories', { auth: false })
      .then((rows) => setCategories(rows || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!id || !user || loading) return;
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
          company_name: data.company_name || '',
          sector: data.sector || '',
          job_type: data.job_type || 'tam-zamanli',
          experience_level: data.experience_level || 'her-seviye',
          education_level: data.education_level || 'farketmez',
          salary_type: data.salary_type || (data.salary_min != null || data.salary_max != null ? 'range' : 'gizli'),
          salary_min: data.salary_min != null ? String(data.salary_min) : '',
          salary_max: data.salary_max != null ? String(data.salary_max) : '',
          status: data.status || 'active',
          featured: !!data.featured,
          category_id: data.category_id || 0,
        });
        setRequirements(
          Array.isArray(data.requirements) && data.requirements.length
            ? data.requirements
            : [''],
        );
        setBenefits(
          Array.isArray(data.benefits) && data.benefits.length ? data.benefits : [''],
        );
        setImageUrl(data.image_url || null);
      } catch {
        setLoadErr('İlan bulunamadı.');
      }
    })();
  }, [id, user, profile, loading]);

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
    const minDesc = isAdmin ? 1 : 50;
    if (form.title.trim().length < 5) {
      setMsg('Başlık en az 5 karakter olmalı.');
      return;
    }
    if (form.description.trim().length < minDesc) {
      setMsg(isAdmin ? 'Açıklama gerekli.' : 'Açıklama en az 50 karakter olmalı.');
      return;
    }
    if (form.salary_type === 'range') {
      const sMin = parseSalaryInput(form.salary_min);
      const sMax = parseSalaryInput(form.salary_max);
      if (sMin != null && sMax != null && sMin > sMax) {
        setMsg('Minimum maaş, maksimumdan büyük olamaz.');
        return;
      }
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
      const catId = Number(form.category_id);
      const selected = categories.find((c) => c.id === catId);
      const body: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        city: form.city.trim() || null,
        company_name: form.company_name.trim() || null,
        sector: selected?.name || form.sector.trim() || null,
        job_type: form.job_type || null,
        experience_level: form.experience_level || null,
        education_level: form.education_level || null,
        salary_type: form.salary_type || 'range',
        salary_min: form.salary_type === 'range' ? parseSalaryInput(form.salary_min) : null,
        salary_max: form.salary_type === 'range' ? parseSalaryInput(form.salary_max) : null,
        image_url: nextImage,
        category_id: Number.isFinite(catId) && catId > 0 ? catId : null,
        requirements: requirements.map((r) => r.trim()).filter(Boolean),
        benefits: benefits.map((b) => b.trim()).filter(Boolean),
      };
      if (isAdmin) {
        body.status = form.status;
        body.featured = form.featured;
      }
      await api(`/api/jobs/${id}`, { method: 'PATCH', body });
      setImageUrl(nextImage);
      setImageFile(null);
      setMsg('İlan güncellendi.');
      setTimeout(() => navigate(fromAdmin ? '/admin' : `/ilan/${id}`), 800);
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

  const backHref = fromAdmin ? '/admin' : '/profil/isveren';
  const backLabel = fromAdmin ? '← Admin paneline dön' : '← İlanlarıma dön';
  const inputCls =
    'w-full px-3 py-2.5 rounded-lg border border-background-300 bg-background-100 text-foreground-950 text-sm placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400';
  const labelCls = 'block text-sm font-medium mb-1.5 text-foreground-800';

  return (
    <div className="min-h-screen flex flex-col bg-background-50 text-foreground-950">
      <Navbar />
      <main className="flex-1 pt-[var(--site-header-offset,5rem)] pb-16">
        <div className="max-w-2xl mx-auto px-4">
          <Link to={backHref} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
            {backLabel}
          </Link>
          <h1 className="font-heading text-2xl font-bold mt-3 mb-6 text-foreground-950">İlanı Düzenle</h1>
          {loadErr ? (
            <p className="text-sm text-red-600 dark:text-red-400">{loadErr}</p>
          ) : (
            <form
              onSubmit={save}
              className="space-y-4 rounded-xl border border-background-200 bg-background-100 p-5 text-foreground-950"
            >
              <div>
                <label className={labelCls}>Görsel</label>
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
                      className="block w-full text-sm text-foreground-800"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-xs text-foreground-500 mt-1">JPG, PNG veya WebP — max 8 MB</p>
                  </div>
                </div>
              </div>
              <div>
                <label className={labelCls}>Başlık</label>
                <input
                  className={inputCls}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>Şirket</label>
                <input
                  className={inputCls}
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                />
              </div>
              <div>
                <label className={labelCls}>İş alanı / Kategori</label>
                <select
                  className={inputCls}
                  value={form.category_id || ''}
                  onChange={(e) => {
                    const nextId = Number(e.target.value) || 0;
                    const name = categories.find((c) => c.id === nextId)?.name || '';
                    setForm((prev) => ({
                      ...prev,
                      category_id: nextId,
                      sector: name || prev.sector,
                    }));
                  }}
                >
                  <option value="">Seçin</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-foreground-500 mt-1">
                  Listede görünen iş alanı bu seçimdir.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Şehir</label>
                  <input
                    className={inputCls}
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Çalışma tipi</label>
                  <select
                    className={inputCls}
                    value={form.job_type}
                    onChange={(e) => setForm({ ...form, job_type: e.target.value })}
                  >
                    {JOB_TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Deneyim</label>
                  <select
                    className={inputCls}
                    value={form.experience_level}
                    onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
                  >
                    {EXPERIENCE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Öğrenim durumu</label>
                  <select
                    className={inputCls}
                    value={form.education_level}
                    onChange={(e) => setForm({ ...form, education_level: e.target.value })}
                  >
                    {EDUCATION_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Maaş bilgisi</label>
                <select
                  className={inputCls}
                  value={form.salary_type}
                  onChange={(e) => setForm({ ...form, salary_type: e.target.value })}
                >
                  {SALARY_TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              {form.salary_type === 'range' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Min maaş (TL)</label>
                  <input
                    className={inputCls}
                    placeholder="28075"
                    value={form.salary_min}
                    onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
                  />
                </div>
                <div>
                  <label className={labelCls}>Max maaş (TL)</label>
                  <input
                    className={inputCls}
                    placeholder="35000"
                    value={form.salary_max}
                    onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
                  />
                </div>
              </div>
              )}
              {isAdmin && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Durum</label>
                    <select
                      className={inputCls}
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="inline-flex items-center gap-2 text-sm text-foreground-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.featured}
                        onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                      />
                      Öne çıkan ilan
                    </label>
                  </div>
                </div>
              )}
              <div>
                <label className={labelCls}>Açıklama</label>
                <textarea
                  rows={8}
                  className={`${inputCls} resize-y`}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground-800">Gereksinimler</label>
                  <button
                    type="button"
                    className="text-xs text-primary-600 dark:text-primary-400"
                    onClick={() => setRequirements((p) => [...p, ''])}
                  >
                    + Ekle
                  </button>
                </div>
                {requirements.map((r, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      className={inputCls}
                      value={r}
                      onChange={(e) =>
                        setRequirements((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))
                      }
                    />
                    <button
                      type="button"
                      className="text-foreground-400 px-2"
                      onClick={() =>
                        setRequirements((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)))
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground-800">Yan haklar</label>
                  <button
                    type="button"
                    className="text-xs text-primary-600 dark:text-primary-400"
                    onClick={() => setBenefits((p) => [...p, ''])}
                  >
                    + Ekle
                  </button>
                </div>
                {benefits.map((b, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      className={inputCls}
                      value={b}
                      onChange={(e) =>
                        setBenefits((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))
                      }
                    />
                    <button
                      type="button"
                      className="text-foreground-400 px-2"
                      onClick={() =>
                        setBenefits((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)))
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
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
