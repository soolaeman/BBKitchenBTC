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
  const [activeType, setActiveType] = useState<DocumentType>(initialType);
  const [copied, setCopied] = useState(false);

  // Editable fields for Surat Jalan / Driver
  const [driverName, setDriverName] = useState(invoice.deliveryDriver || 'Pak Ujang (Lalamove)');
  const [driverPhone, setDriverPhone] = useState(invoice.driverPhone || '0812-9876-5432');
  const [plateNumber, setPlateNumber] = useState(invoice.deliveryVehiclePlate || 'B 9482 SXZ');
  const [expedition, setExpedition] = useState(invoice.deliveryExpedition || 'LALAMOVE');

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
  const dp = invoice.dpAmount || (invoice.status === 'PAID' ? total : 0);
  const sisa = Math.max(0, total - dp);

  // Numbers generator
  const docNumber = (() => {
    switch (activeType) {
      case 'RECEIPT':
        return invoice.kuitansiNumber || `KWT-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${invoice.id.replace(/\D/g, '').slice(-4) || '1024'}`;
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
    const itemsList = invoice.items
      .map((it, idx) => `${idx + 1}. *${it.description}* (${it.sku})\n   ${it.quantity} unit x ${formatIDR(it.unitPrice)} = *${formatIDR(it.total)}*`)
      .join('\n');

    let titleText = '';
    if (activeType === 'INVOICE') titleText = `📄 *FAKTUR TAGIHAN RESMI (INVOICE)*\nNo: *${docNumber}*`;
    else if (activeType === 'RECEIPT') titleText = `🧾 *KUITANSI PEMBAYARAN LUNAS*\nNo: *${docNumber}*`;
    else if (activeType === 'QUOTATION') titleText = `📋 *SURAT PENAWARAN HARGA (QUOTATION)*\nNo: *${docNumber}*`;
    else titleText = `🚚 *SURAT JALAN PENGIRIMAN UNIT*\nNo: *${docNumber}*`;

    return `Halo Kak *${invoice.customerName}*! 🙏
Berikut kami lampirkan dokumen transaksi resmi dari *Bukan Baru Kitchen (BBKitchen)*:

${titleText}
Tanggal: ${todayFormatted}

📌 *Rincian Unit:*
${itemsList}

💰 *Total Transaksi:* ${formatIDR(total)}
${dp > 0 && dp < total ? `• DP Dibayarkan: ${formatIDR(dp)}\n• Sisa Pelunasan: *${formatIDR(sisa)}*` : ''}
${activeType === 'RECEIPT' ? `✅ *STATUS: LUNAS BERSIH*` : ''}

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
              <span>📄 Invoice</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveType('RECEIPT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeType === 'RECEIPT'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>🧾 Kuitansi Lunas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveType('QUOTATION')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeType === 'QUOTATION'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-850 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>📋 Quotation</span>
            </button>

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
              <span>🚚 Surat Jalan</span>
            </button>
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
              <span className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-black tracking-widest text-slate-900 uppercase">
                {activeType === 'INVOICE' && 'FAKTUR TAGIHAN (INVOICE)'}
                {activeType === 'RECEIPT' && 'KUITANSI PEMBAYARAN'}
                {activeType === 'QUOTATION' && 'SURAT PENAWARAN HARGA'}
                {activeType === 'DELIVERY_NOTE' && 'SURAT JALAN & DELIVERY ORDER'}
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
                {activeType === 'RECEIPT' || invoice.status === 'PAID' ? (
                  <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-black text-xs uppercase tracking-widest">
                    ✓ LUNAS / PAID
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded font-black text-xs uppercase tracking-widest">
                    {invoice.status || 'UNPAID'}
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
                <span className="font-black text-slate-900">{expedition}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-800 block">Nama Driver / Kurir:</span>
                <span className="font-bold text-slate-900">{driverName} ({driverPhone})</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-orange-800 block">No. Polisi / Kendaraan:</span>
                <span className="font-bold font-mono text-slate-900">{plateNumber}</span>
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
                  <span className="font-bold text-slate-500 uppercase text-[10px] block mb-0.5">Terbilang:</span>
                  <p className="italic font-bold text-slate-900 leading-snug">
                    "{terbilangRupiah(total)} Rupiah"
                  </p>
                </div>

                {activeType === 'INVOICE' && (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1.5">
                    <span className="font-bold text-blue-900 uppercase text-[10px] block">Rekening Resmi Pembayaran:</span>
                    <div className="flex items-center justify-between font-mono text-slate-800">
                      <span>• BCA: <strong>883-129-4821</strong></span>
                      <span className="text-[10px] text-slate-500">a.n. Soolaeman (BBKitchen)</span>
                    </div>
                    <div className="flex items-center justify-between font-mono text-slate-800">
                      <span>• Mandiri: <strong>164-00-049281-2</strong></span>
                      <span className="text-[10px] text-slate-500">a.n. BBKitchen Official</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Numbers Summary */}
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span>Subtotal Produk:</span>
                  <span className="font-mono font-bold">{formatIDR(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-600">
                    <span>Diskon Kesepakatan:</span>
                    <span className="font-mono font-bold">- {formatIDR(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b-2 border-slate-900 text-sm font-black text-slate-950">
                  <span>TOTAL AKHIR:</span>
                  <span className="font-mono">{formatIDR(total)}</span>
                </div>
                {dp > 0 && dp < total && (
                  <>
                    <div className="flex justify-between py-1 text-slate-600">
                      <span>DP Diterima:</span>
                      <span className="font-mono font-bold text-emerald-600">{formatIDR(dp)}</span>
                    </div>
                    <div className="flex justify-between py-1 font-bold text-red-600">
                      <span>Sisa Pelunasan:</span>
                      <span className="font-mono">{formatIDR(sisa)}</span>
                    </div>
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
                      ( {driverName} )
                    </p>
                  </div>
                  <div className="space-y-12">
                    <p className="font-bold text-slate-600">Penerima di Restoran:</p>
                    <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 mx-4">
                      ( {invoice.customerName} )
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-left col-span-2 space-y-1 text-[11px] text-slate-500">
                    <p className="font-bold text-slate-700">Syarat & Ketentuan BBKitchen:</p>
                    <p>1. Unit komersial telah melalui uji QC teknisi 100% normal dan layak operasional resto.</p>
                    <p>2. Garansi fungsi 7 hari terhitung sejak tanggal unit diterima di lokasi pembeli.</p>
                    <p>3. Pembayaran sah hanya melalui rekening resmi yang tertera pada dokumen ini.</p>
                  </div>
                  <div className="space-y-12 text-center">
                    <p className="font-bold text-slate-700">Hormat Kami,</p>
                    <div className="relative">
                      {activeType === 'RECEIPT' && (
                        <div className="absolute inset-0 -top-8 flex items-center justify-center pointer-events-none opacity-80">
                          <span className="border-4 border-red-600 text-red-600 font-black text-lg px-3 py-1 rounded rotate-[-12deg] tracking-widest uppercase">
                            LUNAS
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
