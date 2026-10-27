import { FEEDBACK_WHATSAPP, whatsappUrl } from '@/lib/site';

export default function WhatsAppFloat() {
  return (
    <div className="fixed z-[60] left-3 bottom-20 md:left-5 md:bottom-8 flex flex-col items-start gap-1.5 max-w-[16rem]">
      <p className="text-[11px] leading-snug rounded-lg bg-amber-50 text-amber-950 border border-amber-200 px-2.5 py-1.5 shadow-sm">
        Web sitesi hataları ve gelişimleri içindir.
      </p>
      <a
        href={whatsappUrl(
          FEEDBACK_WHATSAPP.whatsapp,
          'Merhaba, sitede bir hata veya gelişim önerim var:\n',
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 pl-2 pr-3 py-2 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#1ebe57] transition-colors"
        aria-label="Hata ve görüş. Web sitesi hataları ve gelişimleri içindir."
      >
        <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <i className="ri-bug-line text-xl" />
        </span>
        <span className="text-xs font-semibold leading-tight text-left">
          Hata / görüş
        </span>
      </a>
    </div>
  );
}
