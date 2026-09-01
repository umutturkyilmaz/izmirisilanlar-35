import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
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
  const [viaIyzico, setViaIyzico] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const paymentId = searchParams.get('payment');
      const okFlag = searchParams.get('ok') === '1';
      const token = searchParams.get('t');

      // iyzico callback → ?payment=&ok=1
      if (paymentId && (okFlag || !token)) {
        try {
          const p = await api<{ id: string; status: string; package_name?: string }>(
            `/api/payments/${paymentId}`,
          );
          if (cancelled) return;
          if (p.status === 'paid' || p.status === 'test_paid') {
            setValid(true);
            setViaIyzico(p.status === 'paid');
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
        } catch {
          /* fall through */
        }
      }

      // Test modu: sessionStorage token
      try {
        const raw = sessionStorage.getItem('last_order_ok');
        if (raw && token) {
          const order = JSON.parse(raw) as {
            token?: string;
            createdAt?: string;
            paymentId?: string;
          };
          if (order.token === token) {
            if (!cancelled) {
              setValid(true);
              setViaIyzico(false);
              setOrderRef(
                (order.paymentId || order.createdAt || '')
                  .toString()
                  .slice(0, 12)
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '') || 'TEST',
              );
              sessionStorage.removeItem('last_order_ok');
            }
            setLoading(false);
            return;
          }
        }
      } catch {
        /* ignore */
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-16 flex items-center">
        <div className="px-4 max-w-lg mx-auto text-center w-full">
          {loading ? (
            <p className="text-sm text-foreground-600">Ödeme durumu kontrol ediliyor…</p>
          ) : valid ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
                <i className="ri-check-line text-3xl text-green-600" />
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground-950 mb-2">
                {viaIyzico ? 'Ödeme Başarılı' : 'Sipariş Alındı'}
              </h1>
              <p className="text-foreground-600 text-sm leading-relaxed mb-3">
                {pkg?.name} paketi için hakkınız tanımlandı
                {pkg ? ` (${formatPrice(pkg.price)})` : ''}.
              </p>
              <p className="text-xs text-foreground-500 mb-4">
                {viaIyzico
                  ? 'iyzico ödemesi onaylandı; ilan hakkınız hesabınıza işlendi.'
                  : 'Test modu — iyzico anahtarları eklenince gerçek kart tahsilatı açılır.'}
              </p>
              {orderRef && (
                <p className="text-xs text-foreground-500 mb-6">Referans: {orderRef}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/ilan-ekle"
                  className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm"
                >
                  İlan Formuna Git
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
                Bu sayfa yalnızca ödeme sonrası açılır. URL ile hak tanımlanmaz.
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
