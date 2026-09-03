import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { uploadUserFile } from '@/lib/storage';
import {
  fetchCredits,
  type EmployerCredit,
} from '@/lib/credits';

interface JobCategory {
  id: number;
  name: string;
  icon: string;
}

const JOB_TYPES = [
  { value: 'tam-zamanli', label: 'Tam Zamanlı' },
  { value: 'yari-zamanli', label: 'Yarı Zamanlı' },
  { value: 'staj', label: 'Staj' },
  { value: 'uzaktan', label: 'Uzaktan' },
];

const EXPERIENCE_LEVELS = [
  { value: 'junior', label: 'Junior (0-2 Yıl)' },
  { value: 'mid', label: 'Mid-Level (2-5 Yıl)' },
  { value: 'senior', label: 'Senior (5+ Yıl)' },
  { value: 'her-seviye', label: 'Her Seviye' },
];

export default function PostJobPage() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [credits, setCredits] = useState<EmployerCredit[]>([]);
  const [remaining, setRemaining] = useState(0);
  const [selectedCreditId, setSelectedCreditId] = useState('');
  const isAdmin = profile?.role === 'admin';
  const [adminFeatured, setAdminFeatured] = useState(false);
  const [adminDays, setAdminDays] = useState(30);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category_id: 0,
    sector: '',
    description: '',
    company_name: '',
    city: '',
    job_type: 'tam-zamanli' as string,
    experience_level: 'her-seviye' as string,
    salary_min: '' as string,
    salary_max: '' as string,
  });
  const [requirements, setRequirements] = useState<string[]>(['']);
  const [benefits, setBenefits] = useState<string[]>(['']);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    api<{ id: number; name: string; icon: string }[]>('/api/categories', { auth: false })
      .then((data) => {
        if (data) setCategories(data as JobCategory[]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        company_name: profile.company_name || '',
        city: profile.city || '',
      }));
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const list = await fetchCredits(user.id);
      const total = list.reduce((s, c) => s + (c.remaining || 0), 0);
      if (cancelled) return;
      setCredits(list);
      setRemaining(total);
      if (list.length > 0) setSelectedCreditId(list[0].id);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, submitResult]);

  const updateField = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (submitResult) setSubmitResult(null);
  };

  const addRequirement = () => setRequirements((prev) => [...prev, '']);
  const removeRequirement = (i: number) => {
    if (requirements.length <= 1) return;
    setRequirements((prev) => prev.filter((_, idx) => idx !== i));
  };
  const updateRequirement = (i: number, val: string) => {
    setRequirements((prev) => prev.map((r, idx) => (idx === i ? val : r)));
  };

  const addBenefit = () => setBenefits((prev) => [...prev, '']);
  const removeBenefit = (i: number) => {
    if (benefits.length <= 1) return;
    setBenefits((prev) => prev.filter((_, idx) => idx !== i));
  };
  const updateBenefit = (i: number, val: string) => {
    setBenefits((prev) => prev.map((b, idx) => (idx === i ? val : b)));
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'İlan başlığı zorunludur';
    else if (formData.title.trim().length < 5) errors.title = 'Başlık en az 5 karakter olmalıdır';
    if (!formData.category_id || formData.category_id === 0) errors.category_id = 'Kategori seçmelisiniz';
    if (!formData.description.trim()) errors.description = 'İlan açıklaması zorunludur';
    else if (formData.description.trim().length < 50) errors.description = 'Açıklama en az 50 karakter olmalıdır';
    if (!formData.company_name.trim()) errors.company_name = 'Şirket adı zorunludur';
    if (!formData.job_type) errors.job_type = 'Çalışma tipi seçmelisiniz';
    if (!formData.experience_level) errors.experience_level = 'Deneyim seviyesi seçmelisiniz';
    if (!isAdmin && !selectedCreditId) errors.credit = 'Yayınlamak için paket hakkı seçmelisiniz';
    const salaryMin = parseInt(formData.salary_min, 10);
    const salaryMax = parseInt(formData.salary_max, 10);
    if (formData.salary_min && isNaN(salaryMin)) errors.salary_min = 'Geçerli bir sayı giriniz';
    if (formData.salary_max && isNaN(salaryMax)) errors.salary_max = 'Geçerli bir sayı giriniz';
    if (salaryMin && salaryMax && salaryMin > salaryMax) errors.salary_max = 'Maksimum maaş minimumdan düşük olamaz';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;
    setSubmitting(true);
    setSubmitResult(null);
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const uploaded = await uploadUserFile('job-images', user.id, imageFile);
        if (uploaded.error) throw new Error(uploaded.error);
        imageUrl = uploaded.url;
      }

      const filteredRequirements = requirements.filter((r) => r.trim() !== '');
      const filteredBenefits = benefits.filter((b) => b.trim() !== '');
      const selectedCategory = categories.find((c) => c.id === formData.category_id);

      await api('/api/jobs', {
        body: {
          ...(isAdmin ? {} : { credit_id: selectedCreditId }),
          title: formData.title.trim(),
          category_id: formData.category_id,
          sector: selectedCategory?.name || formData.sector || '',
          description: formData.description.trim(),
          company_name: formData.company_name.trim(),
          city: formData.city.trim() || null,
          job_type: formData.job_type,
          experience_level: formData.experience_level,
          salary_min: formData.salary_min ? parseInt(formData.salary_min, 10) : null,
          salary_max: formData.salary_max ? parseInt(formData.salary_max, 10) : null,
          requirements: filteredRequirements.length > 0 ? filteredRequirements : null,
          benefits: filteredBenefits.length > 0 ? filteredBenefits : null,
          image_url: imageUrl,
          status: isAdmin ? 'active' : 'pending',
          featured: isAdmin ? adminFeatured : undefined,
          duration_days: isAdmin ? adminDays : undefined,
        },
      });

      const selectedCredit = credits.find((c) => c.id === selectedCreditId);
      const days = isAdmin ? adminDays : selectedCredit?.duration_days || 7;

      setSubmitResult({
        type: 'success',
        message: isAdmin
          ? `İlan yayında. Süre: ${days} gün.`
          : `İlanınız admin onayına gönderildi! Yayın süresi: ${days} gün.`,
      });
      setTimeout(() => navigate(isAdmin ? '/admin' : '/profil/isveren'), 2000);
    } catch (err) {
      setSubmitResult({
        type: 'error',
        message: err instanceof Error ? err.message : 'İlan yayınlanırken bir hata oluştu.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-sm text-foreground-500">Yükleniyor...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 pt-20 md:pt-24 pb-12">
          <div className="text-center max-w-md">
            <h1 className="font-heading font-bold text-xl text-foreground-950 mb-2">İlan Vermek İçin Giriş Yapın</h1>
            <p className="text-sm text-foreground-600 mb-5">İş ilanı yayınlamak için giriş yapmalısınız.</p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/giris" className="px-6 py-2.5 bg-primary-500 text-white font-medium text-sm rounded-lg">Giriş Yap</Link>
              <Link to="/kayit" className="px-6 py-2.5 border border-background-200 text-foreground-700 font-medium text-sm rounded-lg">Kayıt Ol</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (profile.role !== 'employer' && profile.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 pt-20 md:pt-24 pb-12">
          <div className="text-center max-w-md">
            <h1 className="font-heading font-bold text-xl text-foreground-950 mb-2">Sadece İşverenler İlan Verebilir</h1>
            <Link to="/kayit" className="px-6 py-2.5 bg-primary-500 text-white font-medium text-sm rounded-lg">İşveren Olarak Kayıt Ol</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAdmin && profile.dogrulama_durumu !== 'verified') {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4 pt-20 md:pt-24 pb-12">
          <div className="text-center max-w-md">
            <h1 className="font-heading font-bold text-xl text-foreground-950 mb-2">Kimlik Doğrulaması Gerekli</h1>
            <p className="text-sm text-foreground-600 mb-5">İlan vermek için hesabınızın doğrulanması gerekir.</p>
            <Link to="/profil/isveren" className="px-6 py-2.5 bg-primary-500 text-white font-medium text-sm rounded-lg">Profile Dön</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-50">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6">
          <div className="mb-8">
            <h1 className="font-heading font-bold text-2xl text-foreground-950">Yeni İş İlanı Yayınla</h1>
            <p className="text-sm text-foreground-500">
              {isAdmin ? 'Site sahibi ilanı — paket hakkı gerekmez, doğrudan yayına alınır.' : `Kalan yayın hakkı: ${remaining}`}
            </p>
          </div>

          {isAdmin ? (
            <div className="mb-6 p-4 rounded-xl border border-primary-200 bg-primary-50/60 space-y-3">
              <p className="text-sm font-semibold">Admin yayın ayarları</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={adminFeatured} onChange={(e) => setAdminFeatured(e.target.checked)} />
                Öne çıkan ilan
              </label>
              <div>
                <label className="block text-sm mb-1">Yayın süresi (gün)</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={adminDays}
                  onChange={(e) => setAdminDays(parseInt(e.target.value, 10) || 30)}
                  className="w-32 rounded-lg border border-background-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          ) : remaining === 0 ? (
            <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-amber-50 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground-950">Aktif paket hakkınız yok</p>
                <p className="text-xs text-foreground-600 mt-0.5">Önce paket satın alın. Canlı ödeme iyzico onayı sonrası açılacak.</p>
              </div>
              <Link to="/paketler" className="shrink-0 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold">Paketleri Gör</Link>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-xl border border-primary-200 bg-primary-50/60">
              <label className="block text-sm font-semibold mb-2">Kullanılacak paket hakkı *</label>
              <select value={selectedCreditId} onChange={(e) => setSelectedCreditId(e.target.value)} className="w-full rounded-lg border border-background-300 px-3 py-2.5 text-sm">
                {credits.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.package_name} — {c.duration_days} gün{c.featured ? ' · Öne çıkan' : ''} (kalan {c.remaining})
                  </option>
                ))}
              </select>
              {formErrors.credit && <p className="text-xs text-red-600 mt-1">{formErrors.credit}</p>}
            </div>
          )}

          {submitResult && (
            <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${submitResult.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {submitResult.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className={`space-y-6 ${!isAdmin && remaining === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
            <section className="bg-white rounded-xl border border-background-200 p-5 space-y-4">
              <h2 className="font-heading font-bold text-base">Temel Bilgiler</h2>
              <div>
                <label className="block text-sm font-medium mb-1.5">İlan Başlığı *</label>
                <input type="text" value={formData.title} onChange={(e) => updateField('title', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm" />
                {formErrors.title && <p className="text-xs text-red-600 mt-1">{formErrors.title}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Kategori *</label>
                <select value={formData.category_id} onChange={(e) => updateField('category_id', parseInt(e.target.value, 10))} className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm">
                  <option value={0}>Seçiniz</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {formErrors.category_id && <p className="text-xs text-red-600 mt-1">{formErrors.category_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Şirket Adı *</label>
                <input type="text" value={formData.company_name} onChange={(e) => updateField('company_name', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Şehir</label>
                  <input type="text" value={formData.city} onChange={(e) => updateField('city', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Çalışma Tipi</label>
                  <select value={formData.job_type} onChange={(e) => updateField('job_type', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm">
                    {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Deneyim</label>
                <select value={formData.experience_level} onChange={(e) => updateField('experience_level', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm">
                  {EXPERIENCE_LEVELS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Min Maaş</label>
                  <input type="number" value={formData.salary_min} onChange={(e) => updateField('salary_min', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Max Maaş</label>
                  <input type="number" value={formData.salary_max} onChange={(e) => updateField('salary_max', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Açıklama *</label>
                <textarea rows={6} value={formData.description} onChange={(e) => updateField('description', e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-background-200 text-sm resize-none" />
                {formErrors.description && <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">İlan Görseli</label>
                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm" />
              </div>
            </section>

            <section className="bg-white rounded-xl border border-background-200 p-5 space-y-2">
              <h2 className="font-heading font-bold text-base mb-2">Gereksinimler</h2>
              {requirements.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={r} onChange={(e) => updateRequirement(i, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-background-200 text-sm" />
                  <button type="button" onClick={() => removeRequirement(i)} className="px-2 text-foreground-500"><i className="ri-delete-bin-line" /></button>
                </div>
              ))}
              <button type="button" onClick={addRequirement} className="text-sm text-primary-600 font-medium">+ Gereksinim ekle</button>
            </section>

            <section className="bg-white rounded-xl border border-background-200 p-5 space-y-2">
              <h2 className="font-heading font-bold text-base mb-2">Yan Haklar</h2>
              {benefits.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <input type="text" value={b} onChange={(e) => updateBenefit(i, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-background-200 text-sm" />
                  <button type="button" onClick={() => removeBenefit(i)} className="px-2 text-foreground-500"><i className="ri-delete-bin-line" /></button>
                </div>
              ))}
              <button type="button" onClick={addBenefit} className="text-sm text-primary-600 font-medium">+ Yan hak ekle</button>
            </section>

            <div className="flex flex-col sm:flex-row gap-3">
              <button type="submit" disabled={submitting || remaining === 0} className="px-6 py-3 bg-primary-600 text-white font-semibold text-sm rounded-xl disabled:opacity-60">
                {submitting ? 'Gönderiliyor...' : 'İlanı Yayınla'}
              </button>
              <Link to="/profil/isveren" className="px-6 py-3 border border-background-300 font-semibold text-sm rounded-xl text-center">Profile Dön</Link>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
