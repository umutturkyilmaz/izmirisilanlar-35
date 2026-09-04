import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { useAuth } from '@/hooks/useAuth';
import { getPackageById, formatPrice, JOB_PACKAGES } from '@/data/packages';
import { addCreditsFromPackage } from '@/lib/credits';
import { checkRateLimit } from '@/lib/rateLimit';
import { createNotification } from '@/lib/notifications';
import { fetchIyzicoStatus } from '@/lib/iyzico';

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const packageId = searchParams.get('paket') || 'standart';
  const selected = useMemo(() => getPackageById(packageId) || JOB_PACKAGES[0], [packageId]);

  const [form, setForm] = useState({
    fullName: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    companyName: profile?.company_name || '',
    taxId: '',
    address: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [iyzicoOn, setIyzicoOn] = useState(false);

  useEffect(() => {
    fetchIyzicoStatus().then((s) => setIyzicoOn(s.enabled));
  }, []);

  const update = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.fullName.trim()) next.fullName = 'Ad soyad zorunludur';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Geçerli e-posta giriniz';
    }
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10) {
      next.phone = 'Geçerli telefon giriniz';
    }
    if (!form.companyName.trim()) next.companyName = 'Şirket / unvan zorunludur';
    if (!form.address.trim() || form.address.trim().length < 10) {
      next.address = 'Fatura adresi zorunludur';
    }
    if (!form.acceptTerms) next.acceptTerms = 'Mesafeli satış sözleşmesini onaylamalısınız';
    if (!user) next.auth = 'İlan hakkı tanımlamak için giriş yapmalısınız';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    const rl = checkRateLimit(`checkout_${user.id}`, 5, 10 * 60 * 1000);
    if (!rl.ok) {
      setErrors({ auth: `Çok fazla deneme. ${rl.retryAfterSec} sn sonra tekrar deneyin.` });
      return;
    }

    setSubmitting(true);

    try {
      const result = await addCreditsFromPackage(user.id, selected.id, {
        amount: selected.price,
        buyerName: form.fullName.trim(),
        buyerEmail: form.email.trim(),
        buyerPhone: form.phone.trim(),
        companyName: form.companyName.trim(),
        taxId: form.taxId.trim(),
        billingAddress: form.address.trim(),
      });

      if (result.mode === 'iyzico' && result.paymentPageUrl) {
        window.location.href = result.paymentPageUrl;
        return;
      }

      await createNotification({
        userId: user.id,
        title: 'Paket hakkınız tanımlandı',
        body: `${selected.name} paketi için yayınlama hakkınız eklendi.`,
        link: '/ilan-ekle',
      });

      const orderToken = `ok_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(
        'last_order_ok',
        JSON.stringify({
          token: orderToken,
          packageId: selected.id,
          packageName: selected.name,
          amount: selected.price,
          paymentId: result.payment_id,
          createdAt: new Date().toISOString(),
        }),
      );

      navigate(`/odeme/basarili?paket=${selected.id}&t=${orderToken}&payment=${result.payment_id}`);
    } catch (err) {
      setErrors({
        auth: err instanceof Error ? err.message : 'Sipariş tamamlanamadı',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-[var(--site-header-offset,5rem)] pb-16">
        <div className="px-4 md:px-6 lg:px-8 max-w-5xl mx-auto">
          <div className="mb-8">
            <Link to="/paketler" className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1">
              <i className="ri-arrow-left-line" />
              Paketlere dön
            </Link>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground-950 mt-3">
              Ödeme
            </h1>
            <p className="text-foreground-600 text-sm mt-1">
              Dijital hizmet satışı — iş ilanı yayınlama paketi
            </p>
            {!user && (
              <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                İlan hakkı tanımlansın diye önce{' '}
                <Link to="/giris" className="underline font-medium">giriş yapın</Link>
                {' '}veya{' '}
                <Link to="/kayit" className="underline font-medium">işveren kaydı</Link> oluşturun.
              </p>
            )}
            {errors.auth && <p className="mt-2 text-xs text-red-600">{errors.auth}</p>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <form onSubmit={handlePay} className="lg:col-span-3 space-y-5">
              <div className="rounded-2xl border border-background-200 bg-background-50 dark:bg-background-100 p-5 md:p-6 space-y-4">
                <h2 className="font-heading font-semibold text-foreground-950">Alıcı Bilgileri</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Ad Soyad *</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => update('fullName', e.target.value)}
                      className="w-full rounded-xl border border-background-300 bg-background-50 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                    />
                    {errors.fullName && <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">E-posta *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update('email', e.target.value)}
                      className="w-full rounded-xl border border-background-300 bg-background-50 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                    />
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Telefon *</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => update('phone', e.target.value)}
                      placeholder="05xx xxx xx xx"
                      className="w-full rounded-xl border border-background-300 bg-background-50 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                    />
                    {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Şirket / Unvan *</label>
                    <input
                      type="text"
                      value={form.companyName}
                      onChange={(e) => update('companyName', e.target.value)}
                      className="w-full rounded-xl border border-background-300 bg-background-50 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                    />
                    {errors.companyName && <p className="text-xs text-red-600 mt-1">{errors.companyName}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Vergi No / TCKN</label>
                    <input
                      type="text"
                      value={form.taxId}
                      onChange={(e) => update('taxId', e.target.value)}
                      className="w-full rounded-xl border border-background-300 bg-background-50 px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-foreground-700 mb-1.5">Fatura Adresi *</label>
                    <textarea
                      rows={3}
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                      className="w-full rounded-xl border border-background-300 bg-background-50 px-3 py-2.5 text-sm outline-none focus:border-primary-500 resize-none"
                    />
                    {errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-background-200 bg-background-50 dark:bg-background-100 p-5 md:p-6">
                <h2 className="font-heading font-semibold text-foreground-950 mb-3">Ödeme Yöntemi</h2>
                <div className="flex items-center gap-3 p-4 rounded-xl border border-primary-300 bg-primary-50/50 dark:bg-primary-950/20">
                  <i className="ri-bank-card-line text-2xl text-primary-600" />
                  <div>
                    <p className="font-medium text-sm text-foreground-950">Kredi / Banka Kartı (iyzico)</p>
                    <p className="text-xs text-foreground-600 mt-0.5">
                      {iyzicoOn
                        ? '3D Secure ile iyzico Checkout Form’a yönlendirileceksiniz.'
                        : 'iyzico anahtarları henüz yok — test modunda hak anında tanımlanır (kart çekilmez).'}
                    </p>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.acceptTerms}
                    onChange={(e) => update('acceptTerms', e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm text-foreground-700">
                    <Link to="/mesafeli-satis" className="text-primary-600 hover:underline">
                      Mesafeli satış sözleşmesi
                    </Link>
                    ,{' '}
                    <Link to="/kvkk" className="text-primary-600 hover:underline">
                      KVKK
                    </Link>{' '}
                    ve{' '}
                    <Link to="/gizlilik" className="text-primary-600 hover:underline">
                      gizlilik politikasını
                    </Link>{' '}
                    okudum, dijital hizmet bedelini ödemeyi kabul ediyorum. *
                  </span>
                </label>
                {errors.acceptTerms && <p className="text-xs text-red-600 mt-1">{errors.acceptTerms}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-5 w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold transition-colors"
                >
                  {submitting
                    ? 'İşleniyor...'
                    : iyzicoOn
                      ? `${formatPrice(selected.price)} — iyzico ile Öde`
                      : `${formatPrice(selected.price)} — Test Siparişi Tamamla`}
                </button>
              </div>
            </form>

            <aside className="lg:col-span-2">
              <div className="sticky top-24 rounded-2xl border border-background-200 bg-background-50 dark:bg-background-100 p-5 md:p-6">
                <h2 className="font-heading font-semibold text-foreground-950 mb-4">Sipariş Özeti</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-foreground-600">Hizmet</span>
                    <span className="font-medium text-foreground-950 text-right">{selected.name}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-foreground-600">Süre</span>
                    <span className="font-medium text-foreground-950">{selected.durationDays} gün</span>
                  </div>
                  <p className="text-xs text-foreground-500 leading-relaxed pt-1">{selected.description}</p>
                  <div className="border-t border-background-200 pt-3 flex justify-between items-center">
                    <span className="font-semibold text-foreground-950">Toplam (KDV dahil)</span>
                    <span className="font-heading text-xl font-bold text-primary-600">
                      {formatPrice(selected.price)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-background-200">
                  <p className="text-xs font-medium text-foreground-700 mb-2">Diğer paketler</p>
                  <div className="flex flex-col gap-1.5">
                    {JOB_PACKAGES.map((pkg) => (
                      <Link
                        key={pkg.id}
                        to={`/odeme?paket=${pkg.id}`}
                        className={`text-xs px-3 py-2 rounded-lg transition-colors ${
                          pkg.id === selected.id
                            ? 'bg-primary-100 text-primary-800 font-medium'
                            : 'hover:bg-background-200 text-foreground-600'
                        }`}
                      >
                        {pkg.name} — {formatPrice(pkg.price)}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
