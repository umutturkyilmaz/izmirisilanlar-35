import { CONTACT, FEEDBACK_WHATSAPP, whatsappUrl } from '@/lib/site';

export default function WhatsAppFloat() {
  return (
    <>
      {/* Sol: hata / site görüşleri */}
      <a
        href={whatsappUrl(
          FEEDBACK_WHATSAPP.whatsapp,
          'Merhaba, sitede bir hata veya görüşüm var:\n',
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed z-[60] left-3 bottom-20 md:left-5 md:bottom-8 flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebe57] transition-colors max-w-[11.5rem] md:max-w-none"
        aria-label="Hata ve site görüşleri WhatsApp"
      >
        <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <i className="ri-bug-line text-xl" />
        </span>
        <span className="text-xs font-semibold leading-tight text-left">
          Hata / görüş
        </span>
      </a>

      {/* Sağ: genel iletişim */}
      <a
        href={whatsappUrl(CONTACT.whatsapp, 'Merhaba, İzmir İş İlanları 35 hakkında bilgi almak istiyorum.')}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed z-[60] right-3 bottom-20 md:right-5 md:bottom-8 flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebe57] transition-colors"
        aria-label="WhatsApp ile iletişim"
      >
        <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <i className="ri-whatsapp-line text-xl" />
        </span>
        <span className="text-xs font-semibold leading-tight hidden sm:inline">
          WhatsApp
        </span>
      </a>
    </>
  );
}
