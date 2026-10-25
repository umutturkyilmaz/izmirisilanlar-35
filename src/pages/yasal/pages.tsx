import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import Navbar from '@/components/feature/Navbar';
import Footer from '@/components/feature/Footer';
import DocumentHead from '@/components/feature/DocumentHead';
import { SELLER } from '@/lib/site';

function SellerInfo({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-background-200 bg-background-50 dark:bg-background-100 p-4">
      <p className="font-semibold text-foreground-950 mb-2">{title}</p>
      <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-1">
        <dt className="text-foreground-500">Ad Soyad / Unvan</dt>
        <dd>
          {SELLER.name} ({SELLER.brand})
        </dd>
        <dt className="text-foreground-500">Adres</dt>
        <dd>{SELLER.address}</dd>
        <dt className="text-foreground-500">Vergi Dairesi / No</dt>
        <dd>
          {SELLER.taxOffice} — {SELLER.taxNumber}
        </dd>
        <dt className="text-foreground-500">Telefon</dt>
        <dd>{SELLER.phone}</dd>
        <dt className="text-foreground-500">E-posta</dt>
        <dd>{SELLER.email}</dd>
        <dt className="text-foreground-500">Web</dt>
        <dd>{SELLER.web.replace('https://', '')}</dd>
      </dl>
    </div>
  );
}

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
      <SellerInfo title="Veri sorumlusu" />
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
        için geçerlidir. Alıcı: paket satın alan ve sipariş sırasında bilgilerini beyan eden işveren.
      </p>
      <SellerInfo title="Satıcı" />
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Satılan ürün / hizmetler</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Standart İlan (ürün kodu: standart) — 7 gün yayın — {formatPriceInline(499)} + KDV</li>
        <li>Öne Çıkan İlan (ürün kodu: one-cikan) — 14 gün yayın — {formatPriceInline(899)} + KDV</li>
        <li>Kurumsal Paket (ürün kodu: kurumsal) — 30 gün / çoklu ilan — {formatPriceInline(2499)} + KDV</li>
      </ul>
      <p>
        Fiyatlara %20 KDV eklenir; ödeme ekranında KDV dahil toplam tutar gösterilir ve bu tutar
        tahsil edilir. Her satış için e-Arşiv fatura düzenlenir ve alıcının e-posta adresine
        gönderilir.
      </p>
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
        Kart ile tahsilat iyzico altyapısı üzerinden 3D Secure ile yapılır; kart bilgileri
        Platform’da saklanmaz. Ödeme onaylandığında ilan yayınlama hakkı hesabınıza otomatik
        tanımlanır ve e-posta ile bilgilendirilirsiniz.
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

export function TermsPage() {
  return (
    <LegalLayout title="Kullanım Koşulları" path="/kullanim-kosullari">
      <p>
        İzmir İş İlanları 35 (“Platform”)’u kullanan herkes bu koşulları kabul etmiş sayılır.
        Adaylar için hizmet ücretsizdir; işverenler ilan yayınlama paketleri satın alır.
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Üyelik</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Kayıt sırasında verilen bilgilerin doğru ve güncel olması kullanıcının sorumluluğundadır.</li>
        <li>Hesap güvenliği (şifre gizliliği) kullanıcıya aittir.</li>
        <li>İşveren hesapları ilan yayınlamadan önce Platform tarafından doğrulanır.</li>
      </ul>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">İlan kuralları</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>İlanlar gerçek bir iş pozisyonuna ait olmalıdır; yanıltıcı, ayrımcı veya yasa dışı içerik yayınlanamaz.</li>
        <li>Adaylardan ücret talep eden, saadet zinciri veya benzeri ilanlar yasaktır.</li>
        <li>Platform, kurallara aykırı ilanları önceden bildirimde bulunmaksızın yayından kaldırabilir.</li>
      </ul>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Kişisel veriler</h2>
      <p>
        Başvurularla paylaşılan aday bilgileri yalnızca ilgili işe alım süreci için kullanılabilir.
        Ayrıntılar için{' '}
        <Link to="/kvkk" className="text-primary-600 hover:underline">
          KVKK Aydınlatma Metni
        </Link>{' '}
        ve{' '}
        <Link to="/gizlilik" className="text-primary-600 hover:underline">
          Gizlilik Politikası
        </Link>
        .
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Ücretli hizmetler</h2>
      <p>
        Paket satışları{' '}
        <Link to="/mesafeli-satis" className="text-primary-600 hover:underline">
          Mesafeli Satış Sözleşmesi
        </Link>{' '}
        ve{' '}
        <Link to="/iade-iptal" className="text-primary-600 hover:underline">
          İade ve İptal Politikası
        </Link>{' '}
        kapsamındadır.
      </p>
      <h2 className="font-heading font-semibold text-foreground-950 text-base">Sorumluluk</h2>
      <p>
        Platform, işveren ile aday arasında aracılık eder; işe alım kararları ve iş ilişkisinden
        doğan yükümlülükler taraflara aittir. Platform bu koşulları güncelleyebilir; güncel metin
        bu sayfada yayımlanır.
      </p>
    </LegalLayout>
  );
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
        formunu kullanın veya {SELLER.email} adresine yazın; sipariş / ödeme numaranızı belirtin.
        Yanıt süresi hedefi: 1–3 iş günü.
      </p>
      <SellerInfo title="Satıcı" />
    </LegalLayout>
  );
}
