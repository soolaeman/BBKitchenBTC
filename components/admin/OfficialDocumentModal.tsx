'use client';

import React, { useState } from 'react';
import { Invoice, DocumentType } from '@/lib/types/finance';
import { formatIDR } from '@/lib/repositories/warehouse-utils';
import {
  Printer,
  FileText,
  Receipt,
  FileCheck,
  Truck,
  Copy,
  Check,
  X,
  Send,
  Building2,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

interface OfficialDocumentModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  initialType?: DocumentType;
}

export function OfficialDocumentModal({
  invoice,
  isOpen,
  onClose,
  initialType = 'INVOICE',
}: OfficialDocumentModalProps) {
  const [activeType, setActiveType] = useState<DocumentType>(initialType === 'DELIVERY_NOTE' ? 'DELIVERY_NOTE' : (initialType || 'INVOICE'));
  const [copied, setCopied] = useState(false);

  // Editable fields for Surat Jalan / Driver (no fake defaults)
  const [driverName, setDriverName] = useState(invoice.deliveryDriver || '');
  const [driverPhone, setDriverPhone] = useState(invoice.driverPhone || '');
  const [plateNumber, setPlateNumber] = useState(invoice.deliveryVehiclePlate || '');
  const [expedition, setExpedition] = useState(invoice.deliveryExpedition || '');

  if (!isOpen) return null;

  const now = new Date();
  const todayFormatted = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Calculate numbers
  const subtotal = invoice.subtotal || invoice.totalAmount;
  const discount = invoice.discount || 0;
  const total = invoice.totalAmount;
  
  // Multi-Payment installments calculation
  const paymentsList = (invoice.payments && invoice.payments.length > 0)
    ? invoice.payments
    : (invoice.dpAmount && invoice.dpAmount > 0
        ? [{ id: 'pay_1', label: 'Pembayaran 1 (DP)', amount: invoice.dpAmount, date: invoice.issueDate || todayFormatted, method: invoice.paymentMethod || 'TRANSFER_JAGO_SYARIAH' }]
        : []);

  const totalPaid = paymentsList.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const sisa = Math.max(0, total - totalPaid);
  const isFullyPaid = invoice.status === 'PAID' || (total > 0 && totalPaid >= total);

  // Numbers generator
  const docNumber = (() => {
    switch (activeType) {
      case 'QUOTATION':
        return invoice.quotationNumber || `QUO-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${invoice.id.replace(/\D/g, '').slice(-4) || '1024'}`;
      case 'DELIVERY_NOTE':
        return invoice.suratJalanNumber || `SJ-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${invoice.id.replace(/\D/g, '').slice(-4) || '1024'}`;
      case 'INVOICE':
      default:
        return invoice.invoiceNumber;
    }
  })();

  const printDocument = () => {
    window.print();
  };

  // Terbilang Rupiah Helper
  const terbilangRupiah = (nominal: number): string => {
    const angka = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (nominal < 12) return angka[nominal];
    if (nominal < 20) return terbilangRupiah(nominal - 10) + ' Belas';
    if (nominal < 100) return terbilangRupiah(Math.floor(nominal / 10)) + ' Puluh ' + terbilangRupiah(nominal % 10);
    if (nominal < 200) return 'Seratus ' + terbilangRupiah(nominal - 100);
    if (nominal < 1000) return terbilangRupiah(Math.floor(nominal / 100)) + ' Ratus ' + terbilangRupiah(nominal % 100);
    if (nominal < 2000) return 'Seribu ' + terbilangRupiah(nominal - 1000);
    if (nominal < 1000000) return terbilangRupiah(Math.floor(nominal / 1000)) + ' Ribu ' + terbilangRupiah(nominal % 1000);
    if (nominal < 1000000000) return terbilangRupiah(Math.floor(nominal / 1000000)) + ' Juta ' + terbilangRupiah(nominal % 1000000);
    return terbilangRupiah(Math.floor(nominal / 1000000000)) + ' Miliar ' + terbilangRupiah(nominal % 1000000000);
  };

  // Generate WA share summary
  const generateWhatsAppShare = () => {
    if (activeType === 'DELIVERY_NOTE') {
      const itemsListSJ = invoice.items
        .map((it, idx) => `${idx + 1}. *${it.description}* (${it.sku}) • ${it.quantity} Unit`)
        .join('\n');

      return `Halo Kak *${invoice.customerName}*! 🙏
Berikut kami lampirkan dokumen surat jalan serah-terima unit dari *Bukan Baru Kitchen (BBKitchen)*:

🚚 *SURAT JALAN PENGIRIMAN UNIT (LUNAS)*
No: *${docNumber}*
Tanggal: ${todayFormatted}

📌 *Daftar Fisik Unit yang Dikirim:*
${itemsListSJ}

📍 *Alamat Pengiriman:*
${invoice.customerAddress || 'Alamat Penerima'}

${expedition ? `🚚 Ekspedisi: *${expedition}*` : ''}
${driverName ? `👤 Driver/Kurir: *${driverName}* ${driverPhone ? `(${driverPhone})` : ''}` : ''}
${plateNumber ? `🚗 No. Polisi: *${plateNumber}*` : ''}

Mohon diperiksa kelengkapan dan kondisi fisik unit saat diterima. Terima kasih!

🏢 *Bukan Baru Kitchen*
Pusat Peralatan Dapur Komersial & Resto Second Terpercaya
Hotline: 0851 2200 1051 | www.bukanbarukitchen.com`;
    }

    const itemsList = invoice.items
      .map((it, idx) => `${idx + 1}. *${it.description}* (${it.sku})\n   ${it.quantity} unit x ${formatIDR(it.unitPrice)} = *${formatIDR(it.total)}*`)
      .join('\n');

    if (activeType === 'QUOTATION') {
      return `Halo Kak *${invoice.customerName}*! 🙏
Berikut kami lampirkan penawaran harga resmi dari *Bukan Baru Kitchen (BBKitchen)*:

📋 *SURAT PENAWARAN HARGA (QUOTATION)*
No: *${docNumber}*
Tanggal: ${todayFormatted}

📌 *Rincian Unit:*
${itemsList}
${discount > 0 ? `🏷️ *Diskon:* -${formatIDR(discount)}\n` : ''}
💰 *Total Penawaran:* ${formatIDR(total)}

ℹ️ *Ketentuan:* Harga di atas adalah penawaran awal sebelum negosiasi deal & penguncian DP.

🏢 *Bukan Baru Kitchen*
Pusat Peralatan Dapur Komersial & Resto Second Terpercaya
Gudang Pamulang 2 / Sawangan / Kedaung, Tangerang Selatan
Hotline: 0851 2200 1051 | www.bukanbarukitchen.com`;
    }

    // INVOICE WA Share
    let shippingTextWA = '';
    if (invoice.hasShipping) {
      if (invoice.shippingFeeType === 'INCLUDED' && (invoice.shippingFee || 0) > 0) {
        shippingTextWA = `\n🚚 *Ongkos Kirim (Include):* ${formatIDR(invoice.shippingFee || 0)}`;
      } else if (invoice.shippingFeeType === 'BUYER_COD') {
        shippingTextWA = `\n🚚 *Ongkos Kirim:* Ditanggung Pembeli (Bayar COD ke Driver saat tiba)`;
      } else if (invoice.shippingFeeType === 'FREE_PROMO') {
        shippingTextWA = `\n🚚 *Ongkos Kirim:* Free Ongkir Promo BBKitchen (Gratis)`;
      }
    }

    const paymentsListWA = paymentsList.length > 0
      ? `\n💳 *Riwayat Pembayaran:*\n` + paymentsList.map((p) => `• ${p.label}: ${formatIDR(p.amount)} (${p.date || todayFormatted})`).join('\n')
      : '';

    const bankPaymentWA = !isFullyPaid
      ? `\n💳 *Rekening Resmi Pembayaran:*\n• Bank Jago Syariah: *5079 8068 4419* a.n. *Ahmad Sulaeman*\n*(DP minimal 50% untuk penguncian unit & jadwal kirim)*\n`
      : `\n✅ *STATUS: LUNAS BERSIH (Siap Penerbitan Surat Jalan)*\n`;

    return `Halo Kak *${invoice.customerName}*! 🙏
Berikut kami lampirkan faktur transaksi resmi dari *Bukan Baru Kitchen (BBKitchen)*:

📄 *FAKTUR TAGIHAN RESMI (INVOICE)*
No: *${docNumber}*
Tanggal: ${todayFormatted}

📌 *Rincian Unit:*
${itemsList}
${shippingTextWA}
${discount > 0 ? `🏷️ *Diskon:* -${formatIDR(discount)}\n` : ''}
💰 *Total Tagihan:* ${formatIDR(total)}
${paymentsListWA}
${!isFullyPaid ? `• Total Masuk: ${formatIDR(totalPaid)}\n• Sisa Pelunasan: *${formatIDR(sisa)}*` : ''}
${bankPaymentWA}
🏢 *Bukan Baru Kitchen*
Pusat Peralatan Dapur Komersial & Resto Second Terpercaya
Gudang Pamulang 2 / Sawangan / Kedaung, Tangerang Selatan
Hotline: 0851 2200 1051 | www.bukanbarukitchen.com`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateWhatsAppShare());
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      {/* Container with Print CSS */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar (Hidden during Print) */}
        <div className="print:hidden bg-slate-950 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {invoice.documentType === 'QUOTATION' ? (
              <button
                type="button"
                onClick={() => setActiveType('QUOTATION')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-500 text-white shadow-md shadow-blue-500/20"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>📋 Surat Penawaran (Quotation)</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveType('INVOICE')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeType === 'INVOICE'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>📄 Faktur Invoice</span>
                </button>

                {isFullyPaid ? (
                  <button
                    type="button"
                    onClick={() => setActiveType('DELIVERY_NOTE')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      activeType === 'DELIVERY_NOTE'
                        ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                        : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>🚚 Surat Jalan (Lunas)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Surat Jalan hanya dapat dicetak setelah transaksi LUNAS"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-850 text-slate-500 opacity-50 cursor-not-allowed border border-slate-800"
                  >
                    <span>🔒 Surat Jalan (Syarat Lunas)</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin!' : 'Copy WA'}</span>
            </button>

            <button
              type="button"
              onClick={printDocument}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE A4 PAPER CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-white text-slate-900 font-sans print:p-0 print:m-0 print:overflow-visible">
          {/* Document Header with BBKitchen Branding */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tighter uppercase font-mono">
                  BB<span className="text-amber-500">KITCHEN</span>
                </span>
                <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded tracking-widest uppercase">
                  Official
                </span>
              </div>
              <p className="text-xs font-bold text-slate-700">
                PT BUKAN BARU KITCHEN INDONESIA
              </p>
              <p className="text-[11px] text-slate-500 max-w-sm leading-snug">
                Sentra Peralatan Dapur Komersial, Mesin Resto, Chiller & Stainless Steel Terkurasi.
                <br />
                Jl. Surya Kencana No. 42, Pamulang 2, Tangerang Selatan
                <br />
                WhatsApp: 0851 2200 1051 | Website: bukanbarukitchen.com
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className={`inline-block px-3 py-1 border rounded text-xs font-black tracking-widest uppercase ${
                activeType === 'INVOICE'
                  ? 'bg-amber-100 border-amber-300 text-amber-950'
                  : activeType === 'RECEIPT'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-950'
                  : activeType === 'QUOTATION'
                  ? 'bg-blue-100 border-blue-300 text-blue-950'
                  : 'bg-orange-100 border-orange-300 text-orange-950'
              }`}>
                {activeType === 'INVOICE' && 'FAKTUR TAGIHAN RESMI (INVOICE)'}
                {activeType === 'RECEIPT' && (dp >= total ? 'KUITANSI PEMBAYARAN LUNAS' : 'KUITANSI PEMBAYARAN BERKALA (DP)')}
                {activeType === 'QUOTATION' && 'SURAT PENAWARAN HARGA (QUOTATION)'}
                {activeType === 'DELIVERY_NOTE' && 'SURAT JALAN PENGIRIMAN UNIT'}
              </span>
              <p className="text-sm font-black font-mono text-slate-900 pt-1">
                {docNumber}
              </p>
              <p className="text-xs text-slate-600">
                Tanggal: <strong className="text-slate-900">{todayFormatted}</strong>
              </p>
              {activeType === 'INVOICE' && (
                <p className="text-xs text-slate-600">
                  Jatuh Tempo: <strong className="text-red-600">{invoice.dueDate || '3 Hari Kerja'}</strong>
                </p>
              )}
              {activeType === 'RECEIPT' && (
                <p className="text-xs text-emerald-800 font-bold">
                  Ref. Faktur: <span>{invoice.invoiceNumber}</span>
                </p>
              )}
              {activeType === 'QUOTATION' && (
                <p className="text-xs text-blue-700 font-semibold">
                  Masa Berlaku: <strong>7 Hari Kerja</strong>
                </p>
              )}
            </div>
          </div>

          {/* Customer & Recipient Information */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs leading-relaxed">
            <div>
              <p className="font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">
                {activeType === 'DELIVERY_NOTE' ? 'Tujuan Pengiriman / Penerima:' : 'Ditujukan Kepada:'}
              </p>
              <p className="font-black text-sm text-slate-900">
                {invoice.customerName || 'Bpk/Ibu Pembeli'}
              </p>
              {invoice.customerCompany && (
                <p className="font-bold text-slate-700">{invoice.customerCompany}</p>
              )}
              <p className="text-slate-600 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{invoice.customerPhone || '08xx-xxxx-xxxx'}</span>
              </p>
              <p className="text-slate-600 flex items-start gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                <span>{invoice.customerAddress || 'Jabodetabek'}</span>
              </p>
            </div>

            <div className="text-right flex flex-col justify-between">
              <div>
                <p className="font-bold text-slate-500 uppercase text-[10px] tracking-wider mb-1">
                  Referensi Transaksi:
                </p>
                <p className="font-mono font-bold text-slate-900">
                  {invoice.orderReference || `ORD-WA-${invoice.id.slice(-6)}`}
                </p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  PIC Sales: <strong>{invoice.createdBy || 'BBKitchen Sales Desk'}</strong>
                </p>
              </div>

              {/* Status Badge in Header */}
              <div>
                {activeType === 'QUOTATION' ? (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded font-black text-xs uppercase tracking-widest">
                    PENAWARAN HARGA AWAL
                  </span>
                ) : activeType === 'DELIVERY_NOTE' ? (
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 border border-orange-300 rounded font-black text-xs uppercase tracking-widest">
                    SIAP KIRIM • LOLOS QC
                  </span>
                ) : activeType === 'RECEIPT' || invoice.status === 'PAID' || dp >= total ? (
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-black text-xs uppercase tracking-widest">
                    ✓ LUNAS / PAID IN FULL
                  </span>
                ) : dp > 0 ? (
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 border border-blue-300 rounded font-black text-xs uppercase tracking-widest">
                    DP DITERIMA ({Math.round((dp / total) * 100)}%)
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded font-black text-xs uppercase tracking-widest">
                    MENUNGGU DP (&gt;50%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* DRIVER & EXPEDITION BAR (ONLY FOR DELIVERY NOTE) */}
          {activeType === 'DELIVERY_NOTE' && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3.5 mb-6 grid grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-800 block">Jasa Ekspedisi:</span>
                <span className="font-black text-slate-900">{expedition || 'Ekspedisi Rekanan'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-800 block">Nama Driver / Kurir:</span>
                <span className="font-bold text-slate-900">{driverName || '-'} {driverPhone ? `(${driverPhone})` : ''}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-800 block">No. Polisi / Kendaraan:</span>
                <span className="font-bold font-mono text-slate-900">{plateNumber || '-'}</span>
              </div>
            </div>
          )}

          {/* ITEM DETAILS TABLE */}
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">Kode SKU</th>
                  <th className="py-2.5 px-3">Deskripsi Produk & Spesifikasi</th>
                  <th className="py-2.5 px-3 text-center w-16">Qty</th>
                  {activeType !== 'DELIVERY_NOTE' && (
                    <>
                      <th className="py-2.5 px-3 text-right w-28">Harga Satuan</th>
                      <th className="py-2.5 px-3 text-right w-28">Total</th>
                    </>
                  )}
                  {activeType === 'DELIVERY_NOTE' && (
                    <th className="py-2.5 px-3 text-center w-36">Kondisi Fisik / QC</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoice.items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-slate-50">
                    <td className="py-3 px-3 text-center font-bold text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{it.sku}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{it.description}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Kondisi: {it.condition || 'Bekas Siap Pakai (Lolos Uji QC)'} • Gudang: {it.warehouseLocation || 'Pamulang 2'}
                      </p>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">{it.quantity} unit</td>
                    {activeType !== 'DELIVERY_NOTE' && (
                      <>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">{formatIDR(it.unitPrice)}</td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatIDR(it.total)}</td>
                      </>
                    )}
                    {activeType === 'DELIVERY_NOTE' && (
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          ✓ 100% Normal Siap Pakai
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FINANCIAL SUMMARY / TERBILANG */}
          {activeType !== 'DELIVERY_NOTE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Terbilang & Payment Info */}
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">
                    {activeType === 'QUOTATION' ? 'Terbilang Estimasi Penawaran:' : 'Terbilang Total Transaksi:'}
                  </span>
                  <p className="italic font-bold text-slate-900 leading-snug">
                    "{terbilangRupiah(total)} Rupiah"
                  </p>
                </div>

                {activeType === 'INVOICE' && (
                  <>
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1.5">
                      <span className="font-bold text-blue-900 uppercase text-[10px] block">Rekening Resmi Pembayaran:</span>
                      <div className="flex items-center justify-between font-mono text-slate-800">
                        <span>• Bank Jago Syariah: <strong>5079 8068 4419</strong></span>
                        <span className="text-[10px] font-bold text-slate-700">a.n. Ahmad Sulaeman</span>
                      </div>
                      <p className="text-[10px] text-blue-800 pt-1 border-t border-blue-200">
                        * Pembayaran bertahap (DP / Pelunasan) diverifikasi melalui mutasi rekening resmi ini.
                      </p>
                    </div>

                    {/* Breakdown Riwayat Pembayaran (Termin) */}
                    {paymentsList.length > 0 && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                        <span className="font-bold text-slate-700 uppercase text-[10px] block border-b border-slate-200 pb-1">
                          Riwayat Catatan Pembayaran ({paymentsList.length} Tahap):
                        </span>
                        <div className="space-y-1">
                          {paymentsList.map((p, pIdx) => (
                            <div key={p.id || pIdx} className="flex justify-between items-center text-[11px]">
                              <span className="text-slate-600">
                                <strong>{p.label || `Pembayaran ${pIdx + 1}`}:</strong> {p.date ? `(${p.date})` : ''}
                              </span>
                              <span className="font-mono font-bold text-emerald-700">{formatIDR(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeType === 'QUOTATION' && (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                    <p className="font-bold text-slate-700">ℹ️ Ketentuan Penawaran Resmi:</p>
                    <p>• Harga penawaran di atas adalah estimasi resmi sebelum finalisasi kesepakatan.</p>
                    <p>• Unit tidak terikat/dikunci sebelum dilakukan transfer DP dan konfirmasi Invoice resmi.</p>
                  </div>
                )}
              </div>

              {/* Numbers Summary */}
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span>Subtotal Unit / Produk:</span>
                  <span className="font-mono font-bold">{formatIDR(subtotal)}</span>
                </div>
                {activeType === 'INVOICE' && invoice.shippingFeeType === 'INCLUDED' && (invoice.shippingFee || 0) > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-700">
                    <span>Ongkos Kirim (Include Tagihan):</span>
                    <span className="font-mono font-bold">+ {formatIDR(invoice.shippingFee || 0)}</span>
                  </div>
                )}
                {activeType === 'INVOICE' && invoice.shippingFeeType === 'BUYER_COD' && (
                  <div className="flex justify-between py-1 border-b border-slate-200 text-[11px] text-amber-700 bg-amber-50/50 px-1 rounded">
                    <span>Ongkir (COD ke Kurir):</span>
                    <span className="italic font-medium">Ditanggung Pembeli</span>
                  </div>
                )}
                {activeType === 'INVOICE' && invoice.shippingFeeType === 'FREE_PROMO' && (
                  <div className="flex justify-between py-1 border-b border-slate-200 text-[11px] text-blue-700 bg-blue-50/50 px-1 rounded">
                    <span>Ongkir BBKitchen:</span>
                    <span className="font-bold uppercase">Free Ongkir Promo</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-600">
                    <span>Diskon Kesepakatan:</span>
                    <span className="font-mono font-bold">- {formatIDR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b-2 border-slate-900 text-sm font-black text-slate-950">
                  <span>{activeType === 'QUOTATION' ? 'TOTAL PENAWARAN:' : 'TOTAL KESEPAKATAN:'}</span>
                  <span className="font-mono">{formatIDR(total)}</span>
                </div>

                {activeType === 'INVOICE' && (
                  <>
                    <div className="flex justify-between py-1 text-emerald-700 font-bold bg-emerald-50 px-2 rounded">
                      <span>Total Pembayaran Masuk:</span>
                      <span className="font-mono">{formatIDR(totalPaid)}</span>
                    </div>
                    {isFullyPaid ? (
                      <div className="flex justify-between py-1.5 font-bold text-emerald-800 bg-emerald-100 px-2 rounded border border-emerald-300">
                        <span>Status Tagihan:</span>
                        <span>✓ LUNAS SEPENUHNYA</span>
                      </div>
                    ) : (
                      <div className="flex justify-between py-1 font-bold text-red-600 bg-red-50 px-2 rounded">
                        <span>Sisa Tagihan Pelunasan:</span>
                        <span className="font-mono">{formatIDR(sisa)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* TERMS & SIGNATURE BOX */}
          <div className="border-t border-slate-200 pt-4 mt-6">
            <div className="grid grid-cols-3 gap-6 text-center text-xs">
              {activeType === 'DELIVERY_NOTE' ? (
                <>
                  <div className="space-y-12">
                    <p className="font-bold text-slate-600">Yang Menyerahkan (Gudang):</p>
                    <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 mx-4">
                      ( Tim Gudang BBKitchen )
                    </p>
                  </div>
                  <div className="space-y-12">
                    <p className="font-bold text-slate-600">Driver / Ekspedisi:</p>
                    <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 mx-4">
                      ( {driverName || '................................'} )
                    </p>
                  </div>
                  <div className="space-y-12">
                    <p className="font-bold text-slate-600">Penerima di Lokasi:</p>
                    <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 mx-4">
                      ( {invoice.customerName} )
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-left col-span-2 space-y-1 text-[11px] text-slate-500">
                    <p className="font-bold text-slate-700">Syarat & Ketentuan BBKitchen:</p>
                    <p>1. Unit komersial telah melalui uji QC teknisi 100% normal dan siap operasional.</p>
                    <p>2. Garansi fungsi 7 hari terhitung sejak tanggal unit diterima di lokasi pembeli.</p>
                    <p>3. Pembayaran sah hanya melalui rekening resmi yang tertera pada dokumen ini.</p>
                  </div>
                  <div className="space-y-12 text-center">
                    <p className="font-bold text-slate-700">Hormat Kami,</p>
                    <div className="relative">
                      {activeType === 'INVOICE' && isFullyPaid && (
                        <div className="absolute inset-0 -top-8 flex items-center justify-center pointer-events-none opacity-85">
                          <span className="border-4 border-emerald-600 text-emerald-600 font-black text-lg px-3 py-1 rounded rotate-[-12deg] tracking-widest uppercase shadow-sm">
                            ✓ LUNAS
                          </span>
                        </div>
                      )}
                      <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 mx-2">
                        PT Bukan Baru Kitchen
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
