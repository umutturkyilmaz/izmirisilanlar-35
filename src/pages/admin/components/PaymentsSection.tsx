import { useEffect, useState } from 'react';
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
}

export default function PaymentsSection() {
  const [rows, setRows] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  if (loading) {
    return <p className="text-sm text-foreground-500 animate-pulse">Ödemeler yükleniyor...</p>;
  }

  if (error) {
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
    <div className="overflow-x-auto rounded-xl border border-background-200">
      <table className="w-full text-sm">
        <thead className="bg-background-100 text-left">
          <tr>
            <th className="px-3 py-2 font-semibold">Tarih</th>
            <th className="px-3 py-2 font-semibold">Paket</th>
            <th className="px-3 py-2 font-semibold">Tutar</th>
            <th className="px-3 py-2 font-semibold">Alıcı</th>
            <th className="px-3 py-2 font-semibold">Durum</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
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
                <span className="px-2 py-0.5 rounded-full text-xs bg-background-200">{r.status}</span>
                <button
                  type="button"
                  className="ml-2 text-xs text-primary-600 hover:underline"
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
