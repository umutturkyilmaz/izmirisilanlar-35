import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { getPackageById, formatPrice } from '@/data/packages';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const pkg = getPackageById(searchParams.get('paket') || '') || getPackageById('standart');
  const [valid, setValid] = useState(false);
  const [orderRef, setOrderRef] = useState('');

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('last_order_ok');
      const token = searchParams.get('t');
      if (!raw || !token) {
        setValid(false);
        return;
      }
      const order = JSON.parse(raw) as { token?: string; createdAt?: string; packageId?: string };
      if (order.token !== token) {
        setValid(false);
        return;
      }
      setValid(true);
      setOrderRef(
        (order.createdAt || '')
          .slice(0, 19)
          .split('-')
          .join('')
          .split(':')
          .join('')
          .split('T')
          .join('')
      );
      sessionStorage.removeItem('last_order_ok');
    } catch {
      setValid(false);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-16 flex items-center">
        <div className="px-4 max-w-lg mx-auto text-center w-full">
          {valid ? (
            <>
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
                <i className="ri-check-line text-3xl text-green-600" />
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground-950 mb-2">
                Sipariş Alındı
              </h1>
              <p className="text-foreground-600 text-sm leading-relaxed mb-3">
                {pkg?.name} paketi için hakkınız tanımlandı
                {pkg ? ` (${formatPrice(pkg.price)})` : ''}.
              </p>
              <p className="text-xs text-foreground-500 mb-4">
                Canlı kart ödemesi iyzico onayı sonrası açılacak.
              </p>
              {orderRef && (
                <p className="text-xs text-foreground-500 mb-6">Referans: ORD-{orderRef}</p>
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
                Bu sayfa yalnızca ödeme formundan sonra açılır. URL ile hak tanımlanmaz.
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
