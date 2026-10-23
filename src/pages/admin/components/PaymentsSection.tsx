import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatPrice } from '@/data/packages';
import { downloadInvoicePdf } from '@/lib/invoice';

interface PaymentRow {
  id: string;
  package_name: string;
  amount: number;
  currency: string;
  status: string;
  buyer_name: string | null;
  buyer_email: string | null;
  company_name: string | null;
  created_at: string;
  has_iyzico?: boolean;
}

const statusLabel: Record<string, string> = {
  pending_admin: 'Admin onayı bekliyor',
  pending_iyzico: 'Ödeme bekliyor',
  paid: 'Ödendi',
  admin_approved: 'Admin onayladı',
  admin_rejected: 'Reddedildi',
  failed: 'Başarısız',
  amount_mismatch: 'Tutar uyuşmazlığı',
  refunded: 'İade edildi',
  test_paid: 'Eski test',
};

export default function PaymentsSection() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<PaymentRow[]>('/api/payments');
      setError(null);
      setRows(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ödemeler yüklenemedi');
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      await api(`/api/admin/payments/${id}/approve`, { method: 'POST', body: {} });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onay başarısız');
    }
    setBusyId(null);
  };

  const verifyIyzico = async (id: string) => {
    setBusyId(id);
    try {
      const r = await api<{ ok: boolean; message?: string }>(
        `/api/admin/payments/${id}/verify-iyzico`,
        { method: 'POST', body: {} },
      );
      setError(r.message || null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Doğrulama başarısız');
    }
    setBusyId(null);
  };

  const [syncing, setSyncing] = useState(false);
  const syncRefunds = async () => {
    setSyncing(true);
    try {
      const r = await api<{ message?: string }>('/api/admin/payments/sync-refunds', {
        method: 'POST',
        body: {},
      });
      setError(r.message || null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eşitleme başarısız');
    }
    setSyncing(false);
  };

  const refund = async (id: string) => {
    if (
      !window.confirm(
        'Bu ödeme iyzico üzerinden iptal/iade edilecek. Kullanılmamış haklar silinir, bu paketle yayınlanan ilanlar kapatılır. Devam edilsin mi?',
      )
    ) {
      return;
    }
    setBusyId(id);
    const send = (body: Record<string, string>) =>
      api<{ ok: boolean; message?: string }>(`/api/admin/payments/${id}/refund`, {
        method: 'POST',
        body,
      });
    try {
      let r;
      try {
        r = await send({});
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('Ödeme ID')) throw err;
        const pid = window.prompt('iyzico panelindeki Ödeme ID (sayı):')?.trim();
        if (!pid) throw err;
        r = await send({ iyzico_payment_id: pid });
      }
      setError(r.message || null);
      await load();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'İade başarısız';
      if (
        msg.includes('iptal/iade başarısız') &&
        window.confirm(
          `${msg}\n\nBu ödeme iyzico panelinden zaten iade edildiyse, kayıtta "İade edildi" olarak işaretleyip ilanları kapatayım mı?`,
        )
      ) {
        try {
          const r = await api<{ message?: string }>(`/api/admin/payments/${id}/mark-refunded`, {
            method: 'POST',
            body: {},
          });
          setError(r.message || null);
          await load();
        } catch (e2) {
          setError(e2 instanceof Error ? e2.message : 'İşaretleme başarısız');
        }
      } else {
        setError(msg);
      }
    }
    setBusyId(null);
  };

  const reject = async (id: string) => {
    const reason = window.prompt('Red gerekçesi (opsiyonel):') || '';
    setBusyId(id);
    try {
      await api(`/api/admin/payments/${id}/reject`, { method: 'POST', body: { reason } });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Red başarısız');
    }
    setBusyId(null);
  };

  if (loading) {
    return <p className="text-sm text-foreground-500 animate-pulse">Ödemeler yükleniyor...</p>;
  }

  if (error && rows.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-sm text-amber-800">
        {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl border border-background-200 bg-background-50">
        <p className="text-sm text-foreground-500">Henüz ödeme / sipariş kaydı yok.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          disabled={syncing}
          onClick={() => void syncRefunds()}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-background-300 hover:bg-background-100 disabled:opacity-50"
          title="iyzico panelinden yapılan iadeleri bul; haklarını sil, ilanlarını kapat"
        >
          {syncing ? 'Eşitleniyor…' : 'iyzico iadelerini eşitle'}
        </button>
      </div>
      {error && (
        <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-sm text-amber-800">{error}</div>
      )}
      <div className="overflow-x-auto rounded-xl border border-background-200">
        <table className="w-full text-sm">
          <thead className="bg-background-100 text-left">
            <tr>
              <th className="px-3 py-2 font-semibold">Tarih</th>
              <th className="px-3 py-2 font-semibold">Paket</th>
              <th className="px-3 py-2 font-semibold">Tutar</th>
              <th className="px-3 py-2 font-semibold">Alıcı</th>
              <th className="px-3 py-2 font-semibold">Durum</th>
              <th className="px-3 py-2 font-semibold">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const canReview = r.status === 'pending_admin' || r.status === 'pending_iyzico';
              const canVerify =
                Boolean(r.has_iyzico) && ['pending_iyzico', 'failed'].includes(r.status);
              const canRefund = ['paid', 'amount_mismatch', 'failed', 'pending_iyzico'].includes(r.status);
              return (
                <tr key={r.id} className="border-t border-background-200">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString('tr-TR')}
                  </td>
                  <td className="px-3 py-2">{r.package_name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{formatPrice(r.amount)}</td>
                  <td className="px-3 py-2">
                    <div>{r.buyer_name || r.company_name || '—'}</div>
                    <div className="text-xs text-foreground-500">{r.buyer_email}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        canReview
                          ? 'bg-amber-100 text-amber-800'
                          : r.status === 'admin_rejected' || r.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {statusLabel[r.status] || r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {canVerify && (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        className="text-xs text-blue-700 font-semibold hover:underline mr-2 disabled:opacity-50"
                        onClick={() => void verifyIyzico(r.id)}
                      >
                        iyzico’dan doğrula
                      </button>
                    )}
                    {canRefund && (
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        className="text-xs text-orange-700 font-semibold hover:underline mr-2 disabled:opacity-50"
                        onClick={() => void refund(r.id)}
                      >
                        İade et
                      </button>
                    )}
                    {canReview && (
                      <>
                        {!r.has_iyzico && (
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            className="text-xs text-green-700 font-semibold hover:underline mr-2 disabled:opacity-50"
                            onClick={() => void approve(r.id)}
                          >
                            Onayla
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busyId === r.id}
                          className="text-xs text-red-600 font-semibold hover:underline mr-2 disabled:opacity-50"
                          onClick={() => void reject(r.id)}
                        >
                          Reddet
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      className="text-xs text-primary-600 hover:underline"
                      onClick={() =>
                        downloadInvoicePdf({
                          id: r.id,
                          packageName: r.package_name,
                          amount: r.amount,
                          buyerName: r.buyer_name,
                          buyerEmail: r.buyer_email,
                          companyName: r.company_name,
                          createdAt: r.created_at,
                          status: r.status,
                        })
                      }
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
