import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import { CONTACT, FEEDBACK_WHATSAPP, whatsappUrl } from '@/lib/site';

export default function ContactPage() {
  const contactWa = whatsappUrl(
    CONTACT.whatsapp,
    'Merhaba, İzmir İş İlanları 35 ile iletişime geçmek istiyorum.',
  );
  const feedbackWa = whatsappUrl(
    FEEDBACK_WHATSAPP.whatsapp,
    'Merhaba, sitede bir hata veya görüşüm var:\n',
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-[var(--site-header-offset,5rem)] pb-16">
        <div className="px-4 md:px-6 lg:px-8 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground-950 mb-3">İletişim</h1>
            <p className="text-sm md:text-base text-foreground-500 max-w-xl mx-auto">
              Tüm sorular, destek ve iş birliği için WhatsApp üzerinden yazabilirsiniz.
            </p>
          </div>

          <div className="space-y-4">
            <a
              href={contactWa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-xl border border-background-200 bg-white dark:bg-background-100 hover:border-[#25D366] transition-colors group"
            >
              <span className="w-12 h-12 rounded-xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center shrink-0">
                <i className="ri-whatsapp-line text-2xl" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading font-semibold text-foreground-950 group-hover:text-[#128C7E]">
                  Genel iletişim
                </h2>
                <p className="text-sm text-foreground-600 mt-0.5">{CONTACT.phone}</p>
                <p className="text-xs text-foreground-400 mt-1">İlan, paket, kayıt ve destek</p>
              </div>
              <i className="ri-arrow-right-up-line text-xl text-foreground-400 group-hover:text-[#25D366]" />
            </a>

            <a
              href={feedbackWa}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 rounded-xl border border-background-200 bg-white dark:bg-background-100 hover:border-[#25D366] transition-colors group"
            >
              <span className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <i className="ri-bug-line text-2xl" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading font-semibold text-foreground-950">Hata / site görüşleri</h2>
                <p className="text-sm text-foreground-600 mt-0.5">{FEEDBACK_WHATSAPP.phone}</p>
                <p className="text-xs text-foreground-400 mt-1">Teknik sorun ve önerileriniz</p>
              </div>
              <i className="ri-arrow-right-up-line text-xl text-foreground-400 group-hover:text-[#25D366]" />
            </a>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-background-200 bg-white dark:bg-background-100 p-5">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 flex items-center justify-center mb-3">
                  <i className="ri-map-pin-line text-lg text-secondary-600" />
                </div>
                <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-1">Adres</h3>
                <p className="text-sm text-foreground-600">Alsancak Mah. Kıbrıs Şehitleri Cd. No:35</p>
                <p className="text-sm text-foreground-600">Konak / İzmir</p>
              </div>
              <div className="rounded-xl border border-background-200 bg-white dark:bg-background-100 p-5">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                  <i className="ri-time-line text-lg text-green-600" />
                </div>
                <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-1">Çalışma Saatleri</h3>
                <p className="text-sm text-foreground-600">Pazartesi - Cuma</p>
                <p className="text-sm text-foreground-600">09:00 - 18:00</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
