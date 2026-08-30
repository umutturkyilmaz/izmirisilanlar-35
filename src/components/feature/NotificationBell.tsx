import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { listNotifications, markNotificationRead } from '@/lib/notifications';

type Note = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Note[]>([]);

  useEffect(() => {
    if (!user) return;
    listNotifications(user.id).then((data) => setItems(data as Note[]));
  }, [user, open]);

  if (!user) return null;

  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-foreground-700 hover:bg-background-200"
        aria-label="Bildirimler"
      >
        <i className="ri-notification-3-line text-lg" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-background-200 bg-background-50 shadow-lg z-50">
          <div className="px-3 py-2 border-b border-background-200 text-sm font-semibold">Bildirimler</div>
          {items.length === 0 ? (
            <p className="p-4 text-xs text-foreground-500">Bildirim yok.</p>
          ) : (
            items.map((n) => (
              <Link
                key={n.id}
                to={n.link || '#'}
                onClick={() => {
                  void markNotificationRead(n.id);
                  setOpen(false);
                }}
                className={`block px-3 py-2.5 border-b border-background-100 hover:bg-background-100 ${
                  n.read ? 'opacity-70' : ''
                }`}
              >
                <p className="text-sm font-medium text-foreground-950">{n.title}</p>
                <p className="text-xs text-foreground-600 mt-0.5 line-clamp-2">{n.body}</p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
