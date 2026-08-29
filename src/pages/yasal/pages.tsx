import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';

type LegalProps = {
  title: string;
  children: ReactNode;
};

function LegalLayout({ title, children }: LegalProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20 md:pt-24 pb-16">
        <article className="px-4 md:px-6 lg:px-8 max-w-3xl mx-auto">
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground-950 mb-2">{title}</h1>
          <p className="text-xs text-foreground-500 mb-8">Son güncelleme: 25 Ağustos 2026</p>
          <div className="prose-legal space-y-5 text-sm text-foreground-700 leading-relaxed">{children}</div>
          <p className="mt-10 text-sm">
            <Link to="/iletisim" className="text-primary-600 hover:underline">
              İletişim
            </Link>
            {' · '}
            <Link to="/paketler" className="text-primary-600 hover:underline">
              Paketler
            </Link>
          </p>
        </article>
      </main>
      <Footer />
    </div>
  );
}

export function KvkkPage() {
  return (
    <LegalLayout title="KVKK Aydınlatma Metni">
      <p>
        İzmir İş İlanları 35 (“Platform”) olarak 6698 sayılı Kişisel Verilerin Korunması Kanunu
        kapsamında veri sorumlusu sıfatıyla kişisel verilerinizi aşağıda açıklanan amaçlarla işleriz.
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">İşlenen veriler</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Kimlik ve iletişim: ad soyad, e-posta, telefon, şehir</li>
        <li>İşveren: şirket unvanı, vergi numarası, fatura adresi</li>
        <li>Aday: CV, ön yazı, başvuru geçmişi</li>
        <li>İşlem güvenliği: oturum ve teknik log kayıtları</li>
      </ul>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Amaçlar</h2>
      <p>
        Üyelik, ilan yayınlama, başvuru yönetimi, ödeme ve faturalama (iyzico aktif olduğunda),
        destek, yasal yükümlülükler ve dolandırıcılık önleme.
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Haklarınız</h2>
      <p>
        KVKK m.11 kapsamındaki haklarınız için{' '}
        <Link to="/iletisim" className="text-primary-600 hover:underline">
          iletişim
        </Link>{' '}
        kanallarından bize ulaşabilirsiniz.
      </p>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Gizlilik Politikası">
      <p>
        Bu politika, Platform’u kullanırken toplanan bilgilerin nasıl korunduğunu açıklar. Adaylar
        için hizmet ücretsizdir; işverenler dijital ilan yayınlama hizmeti satın alır.
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Paylaşım</h2>
      <p>
        Verileriniz, hizmetin sunulması için gerekli olduğu ölçüde (ör. ödeme altyapısı iyzico,
        barındırma) iş ortaklarıyla ve yasal zorunluluk halinde yetkili mercilerle paylaşılabilir.
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Çerezler</h2>
      <p>
        Oturum, dil ve tema tercihleri için zorunlu çerezler kullanılır. Analitik çerezler
        eklendiğinde bilgilendirme güncellenecektir.
      </p>
    </LegalLayout>
  );
}

export function DistanceSalesPage() {
  return (
    <LegalLayout title="Mesafeli Satış Sözleşmesi">
      <p>
        Bu sözleşme, Platform üzerinden satılan dijital hizmet (iş ilanı yayınlama paketleri)
        için geçerlidir. Satıcı: İzmir İş İlanları 35 işletmesi. Alıcı: paket satın alan işveren.
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Hizmet</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Standart İlan — 7 gün yayın</li>
        <li>Öne Çıkan İlan — 14 gün yayın, vitrin</li>
        <li>Kurumsal Paket — 30 gün, çoklu ilan hakkı</li>
      </ul>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Cayma</h2>
      <p>
        Dijital içeriğin ifasına (ilan hakkının tanımlanması) onay verildikten sonra cayma hakkı
        6502 sayılı Kanun ve ilgili yönetmelik çerçevesinde sınırlanabilir. Kullanılmamış haklar
        için destek talebi{' '}
        <Link to="/iletisim" className="text-primary-600 hover:underline">
          iletişim
        </Link>{' '}
        üzerinden iletilebilir.
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Ödeme</h2>
      <p>
        Canlı kart tahsilatı iyzico onayı sonrası aktifleşecektir. Onaya kadar sipariş akışı
        inceleme ve test amaçlıdır.
      </p>
    </LegalLayout>
  );
}
