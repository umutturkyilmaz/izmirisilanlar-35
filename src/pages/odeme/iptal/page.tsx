import { Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-16 flex items-center">
        <div className="px-4 max-w-lg mx-auto text-center w-full">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-5">
            <i className="ri-close-line text-3xl text-amber-600" />
          </div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground-950 mb-2">
            Ödeme İptal Edildi
          </h1>
          <p className="text-foreground-600 text-sm leading-relaxed mb-6">
            Ödeme işlemi tamamlanmadı. İstediğiniz zaman paket seçerek tekrar deneyebilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/paketler"
              className="px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm"
            >
              Paketlere Dön
            </Link>
            <Link
              to="/iletisim"
              className="px-5 py-3 rounded-xl border border-background-300 text-foreground-800 font-semibold text-sm hover:bg-background-100"
            >
              Destek Al
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
