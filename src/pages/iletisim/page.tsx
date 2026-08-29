import { useState } from 'react';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import supabase from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rateLimit';
import { enqueueEmail } from '@/lib/emailQueue';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone_alt: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus(null);

    const formEl = e.currentTarget;
    const honeypotValue = new FormData(formEl).get('phone_alt');
    if (honeypotValue && String(honeypotValue).trim().length > 0) {
      setStatus({ type: 'success', text: 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.' });
      return;
    }

    if (formData.message.length > 500) {
      setStatus({ type: 'error', text: 'Mesajınız 500 karakteri aşamaz.' });
      return;
    }

    setSubmitting(true);

    try {
      const rl = checkRateLimit(`contact_${formData.email}`, 3, 15 * 60 * 1000);
      if (!rl.ok) {
        setStatus({ type: 'error', text: `Çok fazla istek. ${rl.retryAfterSec} sn sonra tekrar deneyin.` });
        setSubmitting(false);
        return;
      }

      const { error } = await supabase.from('contact_messages').insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      if (error) {
        // Tablo yoksa veya RLS: mailto yedek
        const body = encodeURIComponent(
          `Konu: ${formData.subject}\nGönderen: ${formData.name} <${formData.email}>\n\n${formData.message}`
        );
        window.location.href = `mailto:destek@izmirisilanlari35.com?subject=${encodeURIComponent(formData.subject)}&body=${body}`;
        setStatus({
          type: 'success',
          text: 'E-posta uygulamanız açıldı. Gönderimi tamamlayın veya daha sonra tekrar deneyin.',
        });
      } else {
        void enqueueEmail({
          to: formData.email.trim(),
          subject: `İletişim alındı: ${formData.subject.trim()}`,
          body: `Merhaba ${formData.name.trim()},\n\nMesajınızı aldık. En kısa sürede dönüş yapacağız.\n\n— İzmir İş İlanları 35`,
          kind: 'contact_ack',
          meta: { source: 'contact_form' },
        });
        setStatus({ type: 'success', text: 'Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.' });
        setFormData({ name: '', email: '', subject: '', message: '', phone_alt: '' });
      }
    } catch {
      setStatus({ type: 'error', text: 'Bağlantı hatası. Lütfen daha sonra tekrar deneyin.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'message' && value.length > 500) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const charCount = formData.message.length;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-16">
        <div className="px-4 md:px-6 lg:px-8 max-w-5xl mx-auto">

          {/* Page Header */}
          <div className="text-center mb-10">
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground-950 mb-3">İletişim</h1>
            <p className="text-sm md:text-base text-foreground-500 max-w-xl mx-auto">
              Sorularınız, önerileriniz veya iş birliği talepleriniz için bizimle iletişime geçebilirsiniz.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Contact Info Cards */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-5 hover:border-background-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-3">
                  <i className="ri-mail-line text-lg text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-1">E-posta</h3>
                <p className="text-sm text-foreground-600">destek@izmirisilanlari35.com</p>
                <p className="text-xs text-foreground-400 mt-1">7/24 e-posta desteği</p>
              </div>

              <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-5 hover:border-background-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center mb-3">
                  <i className="ri-phone-line text-lg text-accent-600 dark:text-accent-400" />
                </div>
                <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-1">Telefon</h3>
                <p className="text-sm text-foreground-600">+90 232 444 35 35</p>
                <p className="text-xs text-foreground-400 mt-1">Hafta içi 09:00 - 18:00</p>
              </div>

              <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-5 hover:border-background-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-secondary-100 dark:bg-secondary-900/30 flex items-center justify-center mb-3">
                  <i className="ri-map-pin-line text-lg text-secondary-600 dark:text-secondary-400" />
                </div>
                <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-1">Adres</h3>
                <p className="text-sm text-foreground-600">Alsancak Mah. Kıbrıs Şehitleri Cd. No:35</p>
                <p className="text-sm text-foreground-600">Konak / İzmir</p>
              </div>

              <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-5 hover:border-background-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                  <i className="ri-time-line text-lg text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-heading font-semibold text-sm text-foreground-950 mb-1">Çalışma Saatleri</h3>
                <p className="text-sm text-foreground-600">Pazartesi - Cuma</p>
                <p className="text-sm text-foreground-600">09:00 - 18:00</p>
                <p className="text-xs text-foreground-400 mt-1">Hafta sonu kapalı</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-background-100 rounded-xl border border-background-200 p-6 md:p-8">
                <h2 className="font-heading font-semibold text-lg text-foreground-950 mb-1">Bize Mesaj Gönderin</h2>
                <p className="text-sm text-foreground-500 mb-6">
                  Formu doldurun, en kısa sürede size dönüş yapalım.
                </p>

                {status && (
                  <div className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium ${
                    status.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <i className={`${status.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'} text-base`} />
                      {status.text}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Honeypot */}
                  <input
                    type="text"
                    name="phone_alt"
                    value={formData.phone_alt}
                    onChange={handleChange}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    readOnly
                    className="hp-field"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="contact-name" className="block text-sm font-medium text-foreground-700 mb-1.5">
                        Ad Soyad <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Adınız ve soyadınız"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-background-50 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-email" className="block text-sm font-medium text-foreground-700 mb-1.5">
                        E-posta <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="ornek@email.com"
                        className="w-full px-3.5 py-2.5 rounded-lg bg-background-50 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-medium text-foreground-700 mb-1.5">
                      Konu <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg bg-background-50 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Konu seçiniz</option>
                      <option value="Genel Soru">Genel Soru</option>
                      <option value="İlan Verme">İlan Verme</option>
                      <option value="İş Birliği">İş Birliği</option>
                      <option value="Teknik Destek">Teknik Destek</option>
                      <option value="Şikayet / Öneri">Şikayet / Öneri</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium text-foreground-700 mb-1.5">
                      Mesajınız <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={5}
                      maxLength={500}
                      placeholder="Mesajınızı buraya yazın..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-background-50 dark:bg-background-50 border border-background-200 text-sm text-foreground-950 placeholder:text-foreground-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors resize-none"
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-foreground-400">En fazla 500 karakter</p>
                      <p className={`text-xs font-medium ${charCount > 450 ? 'text-red-500' : charCount > 350 ? 'text-yellow-600' : 'text-foreground-400'}`}>
                        {charCount}/500
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-3 bg-primary-500 text-white font-medium text-sm rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin" />
                        Gönderiliyor...
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-line" />
                        Mesajı Gönder
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}