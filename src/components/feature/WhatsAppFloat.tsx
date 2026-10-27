import { useState } from 'react';
import { FEEDBACK_WHATSAPP, whatsappUrl } from '@/lib/site';

const NOTE_KEY = 'feedback-note-closed';

export default function WhatsAppFloat() {
  const [noteOpen, setNoteOpen] = useState(() => {
    try {
      return localStorage.getItem(NOTE_KEY) !== '1';
    } catch {
      return true;
    }
  });

  const closeNote = () => {
    setNoteOpen(false);
    try {
      localStorage.setItem(NOTE_KEY, '1');
    } catch {
      /* depolama kapalıysa sadece bu oturumda gizli kalır */
    }
  };

  return (
    <div className="fixed z-[60] left-3 bottom-20 md:left-5 md:bottom-8 flex flex-col items-start gap-1">
      {noteOpen && (
        <p className="flex items-center gap-1 text-[10px] leading-tight rounded-md bg-amber-50 text-amber-950 border border-amber-200 pl-2 pr-0.5 py-0.5 shadow-sm">
          <span>Site hataları ve gelişimleri için</span>
          <button
            type="button"
            onClick={closeNote}
            className="w-4 h-4 flex items-center justify-center rounded text-amber-800 hover:bg-amber-100"
            aria-label="Uyarıyı kapat"
          >
            <i className="ri-close-line text-xs" />
          </button>
        </p>
      )}
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
