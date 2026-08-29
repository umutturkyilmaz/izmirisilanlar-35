import { jsPDF } from 'jspdf';
import { formatPrice } from '@/data/packages';

export type InvoiceData = {
  id: string;
  packageName: string;
  amount: number;
  currency?: string;
  buyerName?: string | null;
  buyerEmail?: string | null;
  companyName?: string | null;
  taxId?: string | null;
  billingAddress?: string | null;
  createdAt: string;
  status?: string;
};

export function downloadInvoicePdf(inv: InvoiceData) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const margin = 20;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Izmir Is Ilanlari 35', margin, y);
  y += 8;
  doc.setFontSize(12);
  doc.text('Fatura / Makbuz (On Izleme)', margin, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Belge No: ${inv.id.slice(0, 8).toUpperCase()}`, margin, y);
  y += 6;
  doc.text(`Tarih: ${new Date(inv.createdAt).toLocaleString('tr-TR')}`, margin, y);
  y += 6;
  doc.text(`Durum: ${inv.status || 'awaiting_iyzico'}`, margin, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.text('Alici', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(inv.companyName || inv.buyerName || '-', margin, y);
  y += 5;
  if (inv.buyerName) {
    doc.text(inv.buyerName, margin, y);
    y += 5;
  }
  if (inv.buyerEmail) {
    doc.text(inv.buyerEmail, margin, y);
    y += 5;
  }
  if (inv.taxId) {
    doc.text(`VKN/TCKN: ${inv.taxId}`, margin, y);
    y += 5;
  }
  if (inv.billingAddress) {
    const lines = doc.splitTextToSize(inv.billingAddress, 170);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  }

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Hizmet', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(`${inv.packageName} — ${formatPrice(inv.amount)}`, margin, y);
  y += 12;

  doc.setFontSize(9);
  doc.text(
    'Not: Canli kart tahsilati iyzico onayindan sonra tamamlanacaktir. Bu belge on bilgilendirme amaclidir.',
    margin,
    y,
    { maxWidth: 170 }
  );

  doc.save(`fatura-${inv.id.slice(0, 8)}.pdf`);
}
