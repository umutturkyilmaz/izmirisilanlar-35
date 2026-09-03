import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { ASSETS } from '@/lib/assets';
import { api } from '@/lib/api';

export default function AboutPage() {
  const [stats, setStats] = useState([
    { value: '0', label: 'Aktif İlan', icon: 'ri-briefcase-line' },
    { value: '0', label: 'Kayıtlı İşveren', icon: 'ri-building-line' },
    { value: '0', label: 'Kayıtlı Aday', icon: 'ri-user-line' },
    { value: '0', label: 'Başvuru', icon: 'ri-checkbox-circle-line' },
  ]);

  useEffect(() => {
    api<{
      activeJobs: number;
      companies: number;
      candidates: number;
      successfulApplications: number;
    }>('/api/jobs/stats', { auth: false })
      .then((d) => {
        setStats([
          { value: String(d.activeJobs || 0), label: 'Aktif İlan', icon: 'ri-briefcase-line' },
          { value: String(d.companies || 0), label: 'Kayıtlı İşveren', icon: 'ri-building-line' },
          { value: String(d.candidates || 0), label: 'Kayıtlı Aday', icon: 'ri-user-line' },
          { value: String(d.successfulApplications || 0), label: 'Başvuru', icon: 'ri-checkbox-circle-line' },
        ]);
      })
      .catch(() => {});
  }, []);

  const values = [
    {
      icon: 'ri-shield-check-line',
      title: 'Güvenilirlik',
      description: 'Tüm işverenler vergi numarası ile doğrulanır. Sahte ilanlara karşı sıkı denetim politikamız vardır.',
    },
    {
      icon: 'ri-eye-line',
      title: 'Şeffaflık',
      description: 'İlan detaylarında maaş aralığı, çalışma koşulları ve şirket bilgileri açıkça belirtilir.',
    },
    {
      icon: 'ri-rocket-line',
      title: 'Hız',
      description: 'Başvurular anında işverene iletilir, adaylar başvuru durumlarını gerçek zamanlı takip edebilir.',
    },
    {
      icon: 'ri-heart-line',
      title: 'Yerel Odak',
      description: 'İzmir başta olmak üzere Ege Bölgesi iş gücü piyasasına özel çözümler sunar, yerel işletmeleri destekleriz.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-16">

        {/* Hero Banner */}
        <section className="relative w-full h-[320px] md:h-[400px] overflow-hidden mb-16">
          <img
            src={ASSETS.aboutHero}
            alt="İzmir şehir manzarası"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/50" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-4">
              <h1 className="font-heading font-bold text-3xl md:text-5xl text-white mb-3">Hakkımızda</h1>
              <p className="text-sm md:text-lg text-white/80 max-w-xl mx-auto">
                İzmir&apos;in güvenilir iş ilanları platformu
              </p>
            </div>
          </div>
        </section>

        <div className="px-4 md:px-6 lg:px-8 max-w-5xl mx-auto">

          {/* Our Story */}
          <section className="mb-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div>
                <span className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-semibold rounded-full mb-4">
                  Hikayemiz
                </span>
                <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground-950 mb-4">
                  İzmir&apos;in Plakasından İlham,<br />Türkiye&apos;ye Hizmet
                </h2>
                <div className="space-y-3 text-sm md:text-base text-foreground-600 leading-relaxed">
                  <p>
                    <strong className="text-foreground-950">İzmir İş İlanları 35</strong>, İzmir ve tüm Türkiye için iş ilanı yayınlama ve iş arama platformudur. Adını İzmir&apos;in plaka kodu 35&apos;ten alır.
                  </p>
                  <p>
                    Platformumuz, işverenlerin adaylara ulaşmasını sağlarken adaylara da ücretsiz başvuru imkânı sunar. İşveren kayıtlarında vergi numarası alınır; ilan vermek için yönetici onayı gerekir. Böylece sahte ilan ve simsar riskine karşı önlem alınır.
                  </p>
                  <p>
                    İzmir iş piyasasına odaklanır; inşaat, turizm, teknoloji, sağlık, üretim ve diğer sektörlerdeki fırsatları tek çatı altında toplar.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="w-full h-[320px] md:h-[380px] rounded-2xl overflow-hidden">
                  <img
                    src={ASSETS.aboutOffice}
                    alt="İzmir İş İlanları 35 ofisi"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-accent-500 text-white rounded-xl px-5 py-3 shadow-sm">
                  <p className="text-2xl font-bold font-heading">İzmir 35</p>
                  <p className="text-xs text-white/80">Yerel istihdam platformu</p>
                </div>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="mb-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-5 text-center hover:border-background-300 transition-colors">
                  <div className="w-10 h-10 mx-auto rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-3">
                    <i className={`${stat.icon} text-lg text-primary-600 dark:text-primary-400`} />
                  </div>
                  <p className="text-2xl md:text-3xl font-bold font-heading text-foreground-950">{stat.value}</p>
                  <p className="text-xs text-foreground-500 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Mission & Vision */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                    <i className="ri-focus-3-line text-lg text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-foreground-950">Misyonumuz</h3>
                </div>
                <p className="text-sm text-foreground-600 leading-relaxed">
                  İzmir başta olmak üzere tüm Türkiye&apos;de iş arayanlarla işverenleri en hızlı, en güvenilir ve en şeffaf şekilde buluşturmak. Yerel işletmelerin büyümesine destek olurken, adayların kariyer hedeflerine ulaşmasını sağlayan teknoloji odaklı bir istihdam ekosistemi oluşturmak.
                </p>
              </div>
              <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                    <i className="ri-eye-line text-lg text-accent-600 dark:text-accent-400" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-foreground-950">Vizyonumuz</h3>
                </div>
                <p className="text-sm text-foreground-600 leading-relaxed">
                  Türkiye&apos;nin güvenilir bölgesel istihdam platformlarından biri olmak. İş arayanlarla işverenleri şeffaf ve doğrulanmış hesaplarla buluşturmak.
                </p>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="mb-16">
            <div className="text-center mb-8">
              <span className="inline-block px-3 py-1 bg-secondary-100 dark:bg-secondary-900/30 text-secondary-700 dark:text-secondary-400 text-xs font-semibold rounded-full mb-3">
                Değerlerimiz
              </span>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground-950">Bizi Biz Yapanlar</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {values.map((val) => (
                <div key={val.title} className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-5 hover:border-background-300 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mb-3">
                    <i className={`${val.icon} text-lg text-accent-600 dark:text-accent-400`} />
                  </div>
                  <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-2">{val.title}</h3>
                  <p className="text-xs text-foreground-500 leading-relaxed">{val.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Team kaldırıldı — sahte isim/fotoğraf yok */}

          {/* CTA */}
          <section className="text-center bg-white dark:bg-background-100 rounded-2xl border border-background-200 p-8 md:p-12">
            <h2 className="font-heading font-bold text-xl md:text-2xl text-foreground-950 mb-2">
              Siz de Ailemize Katılın
            </h2>
            <p className="text-sm text-foreground-500 mb-6 max-w-md mx-auto">
              İster iş arayan bir aday, ister eleman arayan bir işveren olun — İzmir İş İlanları 35 size göre.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/ilanlar" className="w-full sm:w-auto px-6 py-3 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors whitespace-nowrap">
                <i className="ri-search-line mr-1.5" />
                İlanları Keşfet
              </Link>
              <Link to="/kayit" className="w-full sm:w-auto px-6 py-3 bg-background-100 dark:bg-background-50 border border-background-200 text-foreground-700 font-medium text-sm rounded-lg hover:bg-background-200 dark:hover:bg-background-100 transition-colors whitespace-nowrap">
                <i className="ri-user-add-line mr-1.5" />
                Ücretsiz Kayıt Ol
              </Link>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}