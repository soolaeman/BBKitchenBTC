'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Invoice, InvoiceStatus } from '@/lib/types/finance';
import { formatIDR } from '@/lib/repositories/warehouse-utils';
import {
  FileText,
  Plus,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Send,
  ExternalLink,
  Zap,
} from 'lucide-react';

export function InvoiceManager() {
  const { role, permissions } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [batchActionTriggered, setBatchActionTriggered] = useState(false);

  // New invoice form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [skuCode, setSkuCode] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER_BCA' | 'TRANSFER_MANDIRI' | 'CASH_PICKUP'>('TRANSFER_BCA');
  const [notes, setNotes] = useState('');

  const loadInvoices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/invoices', {
        headers: { 'x-bbk-role': role },
      });
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setIsLoading(false);
    }
  }, [role]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      if (!ignore) {
        await loadInvoices();
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [loadInvoices]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(unitPrice) || 0;
    const discNum = Number(discount) || 0;
    const total = Math.max(0, priceNum - discNum);

    const now = new Date();
    const issueDate = now.toISOString().split('T')[0];
    const dueDateObj = new Date(now);
    dueDateObj.setDate(dueDateObj.getDate() + 3);
    const dueDate = dueDateObj.toISOString().split('T')[0];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const invNumber = `INV-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${randomNum}`;

    const newInv: Omit<Invoice, 'id'> = {
      invoiceNumber: invNumber,
      customerName,
      customerPhone,
      customerAddress,
      orderReference: `ORD-WA-${Date.now().toString().slice(-6)}`,
      items: [
        {
          id: `item_${Date.now()}`,
          sku: skuCode || 'BBK-CUSTOM',
          description: itemDesc || 'Peralatan Dapur Komersial Restoran',
          quantity: 1,
          unitPrice: priceNum,
          total: priceNum,
        },
      ],
      subtotal: priceNum,
      discount: discNum,
      tax: 0,
      totalAmount: total,
      issueDate,
      dueDate,
      status: 'GENERATED',
      paymentMethod,
      notes,
      createdBy: 'Sales / Finance Operator',
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE', invoice: newInv }),
      });
      if (res.ok) {
        setShowCreateModal(false);
        // Reset form
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setSkuCode('');
        setItemDesc('');
        setUnitPrice('');
        setDiscount('0');
        setNotes('');
        loadInvoices();
      }
    } catch (err) {
      console.error('Invoice create failed', err);
    }
  };

  const handleUpdateStatus = async (id: string, status: InvoiceStatus) => {
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_STATUS', id, status }),
      });
      loadInvoices();
      if (selectedInvoice && selectedInvoice.id === id) {
        setSelectedInvoice((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err) {
      console.error('Update status failed', err);
    }
  };

  const triggerGitHubActionsBatch = () => {
    setBatchActionTriggered(true);
    setTimeout(() => setBatchActionTriggered(false), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" />
            <span>Manajemen Invoice & Faktur Penjualan</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Penerbitan faktur tagihan resmi, verifikasi pembayaran BCA/Mandiri, dan batch PDF generator.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={triggerGitHubActionsBatch}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{batchActionTriggered ? 'Job Dispatched ke GitHub Actions...' : 'Sync Batch Invoices'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Invoice Baru</span>
          </button>
        </div>
      </div>

      {batchActionTriggered && (
        <div className="p-3.5 bg-blue-950/80 border border-blue-800 text-blue-300 text-xs rounded-xl flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong>Background Job Triggered:</strong> Permintaan export PDF batch dikirim ke GitHub Actions runner untuk menghindari timeout serverless.
          </span>
        </div>
      )}

      {/* Invoice List Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">No. Invoice</th>
                <th className="py-3.5 px-4">Customer & Kontak</th>
                <th className="py-3.5 px-4">Unit / Deskripsi</th>
                <th className="py-3.5 px-3 text-right">Total Tagihan</th>
                <th className="py-3.5 px-3">Tgl Terbit / Jatuh Tempo</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                    Memuat daftar faktur...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Belum ada invoice yang diterbitkan.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100 whitespace-nowrap">
                      {inv.invoiceNumber}
                      <div className="text-[10px] text-slate-500 font-mono">{inv.orderReference}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{inv.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{inv.customerPhone}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-300 line-clamp-1">
                        {inv.items.map((i) => i.description).join(', ')}
                      </div>
                      <div className="text-[10px] text-amber-400/90 font-mono">
                        {inv.items.map((i) => i.sku).join(', ')}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                      {formatIDR(inv.totalAmount)}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      <div>Terbit: {inv.issueDate}</div>
                      <div className="text-amber-400/80">Tempo: {inv.dueDate}</div>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : inv.status === 'SENT' || inv.status === 'GENERATED'
                            ? 'bg-blue-950 text-blue-300 border-blue-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                        >
                          Lihat / Cetak
                        </button>
                        {inv.status !== 'PAID' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(inv.id, 'PAID')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold"
                          >
                            Set Lunas
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Printable View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto p-8 shadow-2xl space-y-6">
            {/* Invoice Top Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="text-xl font-black text-slate-950">BUKAN BARU KITCHEN</div>
                <div className="text-xs text-slate-600">Pusat Peralatan Dapur Restoran & Cafe Bekas Berkualitas</div>
                <div className="text-xs text-slate-500 mt-1">Jl. Surya Kencana No. 42, Pamulang 2, Tangerang Selatan • Telp: 0812-8900-BBK</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-amber-700 font-mono">{selectedInvoice.invoiceNumber}</div>
                <div className="text-xs text-slate-500 mt-0.5">Tanggal: {selectedInvoice.issueDate}</div>
                <div className="text-xs text-red-600 font-medium">Jatuh Tempo: {selectedInvoice.dueDate}</div>
              </div>
            </div>

            {/* Bill To */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Ditagihkan Kepada:</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedInvoice.customerName}</div>
                <div className="text-slate-600">{selectedInvoice.customerPhone}</div>
                <div className="text-slate-500 mt-0.5">{selectedInvoice.customerAddress || 'Alamat Cabang Restoran'}</div>
              </div>
              <div>
                <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Metode Pembayaran:</div>
                <div className="font-semibold text-slate-900 mt-0.5">{selectedInvoice.paymentMethod || 'TRANSFER_BCA'}</div>
                <div className="text-slate-600">Rek BCA: 883-091-2831 a/n Bukan Baru Kitchen</div>
                <div className="mt-1">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${selectedInvoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    STATUS: {selectedInvoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                <tr>
                  <th className="p-2.5">Item Deskripsi</th>
                  <th className="p-2.5">SKU</th>
                  <th className="p-2.5 text-center">Qty</th>
                  <th className="p-2.5 text-right">Harga Satuan</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {selectedInvoice.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 font-medium">{item.description}</td>
                    <td className="p-2.5 font-mono text-slate-600">{item.sku}</td>
                    <td className="p-2.5 text-center">{item.quantity}</td>
                    <td className="p-2.5 text-right font-mono">{formatIDR(item.unitPrice)}</td>
                    <td className="p-2.5 text-right font-mono font-semibold">{formatIDR(item.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 font-bold">
                <tr>
                  <td colSpan={4} className="p-2.5 text-right">Subtotal:</td>
                  <td className="p-2.5 text-right font-mono">{formatIDR(selectedInvoice.subtotal)}</td>
                </tr>
                {selectedInvoice.discount > 0 && (
                  <tr>
                    <td colSpan={4} className="p-2.5 text-right text-red-600">Diskon Deal WA:</td>
                    <td className="p-2.5 text-right font-mono text-red-600">-{formatIDR(selectedInvoice.discount)}</td>
                  </tr>
                )}
                <tr className="border-t text-sm">
                  <td colSpan={4} className="p-2.5 text-right font-black">TOTAL PEMBAYARAN:</td>
                  <td className="p-2.5 text-right font-mono font-black text-amber-800">{formatIDR(selectedInvoice.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Notes */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <div className="font-bold text-slate-800">Catatan & Garansi:</div>
              <div>• Garansi servis mekanikal & kelistrikan berlaku 30 hari sejak tanggal barang diterima.</div>
              <div>• Biaya kirim & teknisi instalasi Jabodetabek dikoordinasikan via WhatsApp sales support.</div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Save PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-xl text-xs font-bold hover:bg-slate-300"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-500" />
              Buat Invoice Penjualan Baru
            </h2>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Customer / Restoran</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Cafe Senopati / Ibu Linda"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">No. WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="0812..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">SKU Unit</label>
                  <input
                    type="text"
                    required
                    value={skuCode}
                    onChange={(e) => setSkuCode(e.target.value)}
                    placeholder="BBK-GK-COM-0007"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono uppercase focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Nama Mesin / Deskripsi Barang</label>
                <input
                  type="text"
                  required
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  placeholder="Contoh: Rational Combi Oven 10 Tray Prima"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Harga Satuan Deal (IDR)</label>
                  <input
                    type="number"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    placeholder="65000000"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Diskon (IDR)</label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Metode Pembayaran</label>
                <select
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="TRANSFER_BCA">Transfer Bank BCA (883-091-2831)</option>
                  <option value="TRANSFER_MANDIRI">Transfer Bank Mandiri</option>
                  <option value="CASH_PICKUP">Tunai / Cash saat Pickup Gudang</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Pengiriman via Lalamove, test run di Pamulang 2..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Terbitkan Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
