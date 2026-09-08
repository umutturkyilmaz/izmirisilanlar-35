import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import DocumentHead from '@/components/feature/DocumentHead';

type LegalProps = {
  title: string;
  path: string;
  children: ReactNode;
};

function LegalLayout({ title, path, children }: LegalProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <DocumentHead title={title} description={`${title} — İzmir İş İlanları 35`} path={path} />
      <Navbar />
      <main className="flex-1 pt-[var(--site-header-offset,5rem)] pb-16">
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
    <LegalLayout title="KVKK Aydınlatma Metni" path="/kvkk">
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
    <LegalLayout title="Gizlilik Politikası" path="/gizlilik">
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
    <LegalLayout title="Mesafeli Satış Sözleşmesi" path="/mesafeli-satis">
      <p>
        Bu sözleşme, Platform üzerinden satılan dijital hizmet (iş ilanı yayınlama paketleri)
        için geçerlidir. Satıcı: İzmir İş İlanları 35 işletmesi. Alıcı: paket satın alan işveren.
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Satılan ürün / hizmetler</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Standart İlan (ürün kodu: standart) — 7 gün yayın — {formatPriceInline(499)}</li>
        <li>Öne Çıkan İlan (ürün kodu: one-cikan) — 14 gün yayın — {formatPriceInline(899)}</li>
        <li>Kurumsal Paket (ürün kodu: kurumsal) — 30 gün / çoklu ilan — {formatPriceInline(2499)}</li>
      </ul>
      <p>
        Güncel fiyat ve satın alma:{' '}
        <Link to="/paketler" className="text-primary-600 hover:underline">
          /paketler
        </Link>
        . Sipariş:{' '}
        <Link to="/odeme" className="text-primary-600 hover:underline">
          /odeme
        </Link>
        .
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Cayma / iade</h2>
      <p>
        Dijital içeriğin ifasına (ilan hakkının tanımlanması) onay verildikten sonra cayma hakkı
        6502 sayılı Kanun ve ilgili yönetmelik çerçevesinde sınırlanabilir. Ayrıntılar için{' '}
        <Link to="/iade-iptal" className="text-primary-600 hover:underline">
          İade ve İptal Politikası
        </Link>
        .
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Ödeme</h2>
      <p>
        Kart ile tahsilat iyzico altyapısı üzerinden yapılır (3D Secure). Canlı tahsilat iyzico
        üye işyeri onayı sonrası aktiftir; onay öncesinde sipariş kaydı oluşturulur ve admin
        incelemesiyle hak tanımlanabilir.
      </p>
    </LegalLayout>
  );
}

function formatPriceInline(n: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n);
}

export function RefundPage() {
  return (
    <LegalLayout title="İade ve İptal Politikası" path="/iade-iptal">
      <p>
        İzmir İş İlanları 35 üzerinden satılan ürünler, iş ilanı yayınlama hakkı sağlayan
        <strong> dijital hizmet paketleridir</strong> (fiziksel ürün gönderimi yoktur).
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">İptal</h2>
      <p>
        Ödeme tamamlanmadan önce siparişten vazgeçebilirsiniz. Kart ödeme sayfasından (iyzico)
        ayrılırsanız tahsilat yapılmaz.
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">İade</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>İlan hakkı henüz kullanılmamışsa destek talebiyle değerlendirme yapılır.</li>
        <li>
          Hak tanımlandıktan ve ilan yayınlandıktan sonra dijital ifa başlamış sayılır; cayma
          hakkı sınırlı olabilir.
        </li>
        <li>Hatalı / mükerrer tahsilatlarda iade talebi öncelikli incelenir.</li>
      </ul>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Başvuru</h2>
      <p>
        İade / iptal için{' '}
        <Link to="/iletisim" className="text-primary-600 hover:underline">
          iletişim
        </Link>{' '}
        formunu kullanın; sipariş / ödeme numaranızı yazın. Yanıt süresi hedefi: 1–3 iş günü.
      </p>
    </LegalLayout>
  );
}
