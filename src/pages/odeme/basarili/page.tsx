import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import DocumentHead from '@/components/feature/DocumentHead';
import { getPackageById, formatPrice } from '@/data/packages';
import { api } from '@/lib/api';
import { createNotification } from '@/lib/notifications';
import { useAuth } from '@/hooks/useAuth';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const pkg = getPackageById(searchParams.get('paket') || '') || getPackageById('standart');
  const [valid, setValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orderRef, setOrderRef] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const paymentId = searchParams.get('payment');
      const pendingFlag = searchParams.get('pending') === '1';
      const okFlag = searchParams.get('ok') === '1';

      if (paymentId) {
        try {
          const p = await api<{ id: string; status: string; package_name?: string }>(
            `/api/payments/${paymentId}`,
          );
          if (cancelled) return;
          const okStatuses = ['paid', 'admin_approved', 'pending_admin'];
          if (okStatuses.includes(p.status) || pendingFlag) {
            setValid(true);
            setStatus(p.status || (pendingFlag ? 'pending_admin' : ''));
            setOrderRef(paymentId.slice(0, 12).toUpperCase());
            if (user && p.status === 'paid') {
              try {
                await createNotification({
                  userId: user.id,
                  title: 'Ödeme onaylandı',
                  body: `${p.package_name || pkg?.name || 'Paket'} için hakkınız tanımlandı.`,
                  link: '/ilan-ekle',
                });
              } catch {
                /* ignore */
              }
            }
            setLoading(false);
            return;
          }
          if (okFlag && p.status) {
            setValid(false);
            setStatus(p.status);
            setLoading(false);
            return;
          }
        } catch {
          /* fall through */
        }
      }

      if (!cancelled) {
        setValid(false);
        setLoading(false);
      }
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [searchParams, user, pkg?.name]);

  const pending = status === 'pending_admin';
  const granted = status === 'paid' || status === 'admin_approved';

  return (
    <div className="min-h-screen flex flex-col">
      <DocumentHead title="Sipariş Durumu" path="/odeme/basarili" />
      <Navbar />
      <main className="flex-1 pt-[var(--site-header-offset,5rem)] pb-16 flex items-center">
        <div className="px-4 max-w-lg mx-auto text-center w-full">
          {loading ? (
            <p className="text-sm text-foreground-600">Sipariş durumu kontrol ediliyor…</p>
          ) : valid ? (
            <>
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
                  pending ? 'bg-amber-100' : 'bg-green-100 dark:bg-green-900/30'
                }`}
              >
                <i
                  className={`text-3xl ${
                    pending ? 'ri-time-line text-amber-600' : 'ri-check-line text-green-600'
                  }`}
                />
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground-950 mb-2">
                {pending ? 'Talep Alındı — Admin Onayı Bekleniyor' : 'Sipariş Başarılı'}
              </h1>
              <p className="text-foreground-600 text-sm leading-relaxed mb-3">
                {pkg?.name} paketi
                {pkg ? ` (${formatPrice(pkg.price)})` : ''}
                {pending
                  ? ' talebiniz admin paneline iletildi. Onaylanınca ilan hakkınız tanımlanacak.'
                  : granted
                    ? ' için yayınlama hakkınız tanımlandı.'
                    : ' kaydı oluşturuldu.'}
              </p>
              <p className="text-xs text-foreground-500 mb-4">
                {pending
                  ? 'Ücretsiz otomatik hak verilmez. Admin onayından sonra profilinizden hakkınızı görebilirsiniz.'
                  : status === 'paid'
                    ? 'iyzico ödemesi onaylandı.'
                    : 'Admin onayı ile hakkınız işlendi.'}
              </p>
              {orderRef && (
                <p className="text-xs text-foreground-500 mb-6">Referans: {orderRef}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to={pending ? '/profil/isveren' : '/ilan-ekle'}
                  className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm"
                >
                  {pending ? 'İşveren Profiline Git' : 'İlan Formuna Git'}
                </Link>
                <Link
                  to="/paketler"
                  className="px-5 py-3 rounded-xl border border-background-300 text-foreground-800 font-semibold text-sm hover:bg-background-100"
                >
                  Paketlere Dön
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-5">
                <i className="ri-shield-keyhole-line text-3xl text-amber-600" />
              </div>
              <h1 className="font-heading text-2xl font-bold text-foreground-950 mb-2">Geçersiz onay</h1>
              <p className="text-sm text-foreground-600 mb-6">
                Bu sayfa yalnızca geçerli sipariş sonrası açılır.
              </p>
              <Link to="/paketler" className="px-5 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold">
                Paketlere Git
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
