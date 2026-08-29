import { Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { JOB_PACKAGES, formatPrice } from '@/data/packages';

export default function PackagesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-16">
        <section className="px-4 md:px-6 lg:px-8 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
            <p className="text-sm font-medium text-primary-600 mb-2">İşveren Hizmetleri</p>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-foreground-950 mb-3">
              İlan Yayınlama Paketleri
            </h1>
            <p className="text-foreground-600 leading-relaxed">
              İzmir İş İlanları 35 üzerinden iş ilanı yayınlamak için aşağıdaki paketlerden birini
              seçip güvenli ödeme ile satın alabilirsiniz. Adaylar için platform ücretsizdir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {JOB_PACKAGES.map((pkg) => (
              <article
                key={pkg.id}
                className={`relative flex flex-col rounded-2xl border p-6 md:p-7 ${
                  pkg.popular
                    ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/20 shadow-lg shadow-primary-500/10'
                    : 'border-background-200 bg-background-50 dark:bg-background-100'
                }`}
              >
                {pkg.badge && (
                  <span
                    className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap ${
                      pkg.popular
                        ? 'bg-primary-600 text-white'
                        : 'bg-secondary-600 text-white'
                    }`}
                  >
                    {pkg.badge}
                  </span>
                )}

                <h2 className="font-heading text-xl font-bold text-foreground-950 mt-2">
                  {pkg.name}
                </h2>
                <p className="text-sm text-foreground-600 mt-2 min-h-[40px]">{pkg.description}</p>

                <div className="mt-5 mb-6">
                  <span className="font-heading text-3xl md:text-4xl font-bold text-foreground-950">
                    {formatPrice(pkg.price)}
                  </span>
                  <span className="text-sm text-foreground-500 ml-1">/ {pkg.durationDays} gün</span>
                </div>

                <ul className="flex flex-col gap-2.5 flex-1 mb-7">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-foreground-700">
                      <i className="ri-check-line text-primary-600 text-lg shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/odeme?paket=${pkg.id}`}
                  className={`w-full text-center py-3 px-4 rounded-xl font-semibold transition-colors ${
                    pkg.popular
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-foreground-950 hover:bg-foreground-800 text-background-50'
                  }`}
                >
                  Satın Al
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-12 md:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { icon: 'ri-shield-check-line', title: 'Güvenli Ödeme', text: 'iyzico altyapısı ile KVKK uyumlu tahsilat' },
              { icon: 'ri-file-list-3-line', title: 'Dijital Hizmet', text: 'Satın alma sonrası ilan yayınlama hakkı tanımlanır' },
              { icon: 'ri-customer-service-2-line', title: 'Destek', text: 'Paket ve fatura sorularınız için iletişim hattı' },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-4 rounded-xl bg-background-100 dark:bg-background-100 border border-background-200"
              >
                <i className={`${item.icon} text-2xl text-primary-600 shrink-0`} />
                <div>
                  <h3 className="font-heading font-semibold text-sm text-foreground-950">{item.title}</h3>
                  <p className="text-xs text-foreground-600 mt-1">{item.text}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-foreground-500 mt-10">
            İlan vermek için önce paket seçin veya{' '}
            <Link to="/ilan-ekle" className="text-primary-600 hover:underline">
              ilan formuna
            </Link>{' '}
            gidin. Detaylar için{' '}
            <Link to="/iletisim" className="text-primary-600 hover:underline">
              iletişime
            </Link>{' '}
            geçebilirsiniz.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
