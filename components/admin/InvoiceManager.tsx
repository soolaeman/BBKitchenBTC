'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Invoice, InvoiceStatus, DocumentType } from '@/lib/types/finance';
import { formatIDR } from '@/lib/repositories/warehouse-utils';
import { OfficialDocumentModal } from './OfficialDocumentModal';
import {
  FileText,
  Plus,
  Printer,
  Receipt,
  FileCheck,
  Truck,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  DollarSign,
} from 'lucide-react';

export function InvoiceManager() {
  const { role } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  // Modal States
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [documentModalType, setDocumentModalType] = useState<DocumentType>('INVOICE');
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Document Form
  const [formDocType, setFormDocType] = useState<DocumentType>('INVOICE');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [skuCode, setSkuCode] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [discount, setDiscount] = useState('0');
  const [dpAmount, setDpAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER_BCA' | 'TRANSFER_MANDIRI' | 'CASH_PICKUP'>('TRANSFER_BCA');
  const [deliveryDriver, setDeliveryDriver] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [expedition, setExpedition] = useState<'LALAMOVE' | 'DELIVEREE' | 'INTERNAL_FLEET' | 'CARGO_EKSPEDISI' | 'PICKUP_SENDIRI'>('LALAMOVE');
  const [notes, setNotes] = useState('');

  const loadInvoices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/invoices', {
        headers: { 'x-bbk-role': role ?? '' },
      });
      const data = await res.json();
      if (data.invoices) setInvoices(data.invoices);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [role]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(unitPrice) || 0;
    const discNum = Number(discount) || 0;
    const dpNum = Number(dpAmount) || 0;
    const total = Math.max(0, priceNum - discNum);

    const now = new Date();
    const issueDate = now.toISOString().split('T')[0];
    const dueDateObj = new Date(now);
    dueDateObj.setDate(dueDateObj.getDate() + 3);
    const dueDate = dueDateObj.toISOString().split('T')[0];
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    const newInv: Omit<Invoice, 'id'> = {
      invoiceNumber: `INV-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${randomNum}`,
      kuitansiNumber: `KWT-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${randomNum}`,
      quotationNumber: `QUO-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${randomNum}`,
      suratJalanNumber: `SJ-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${randomNum}`,
      documentType: formDocType,
      customerName: customerName || 'Pelanggan Umum',
      customerPhone: customerPhone || '08xx-xxxx-xxxx',
      customerAddress,
      customerCompany,
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
      dpAmount: dpNum,
      remainingAmount: Math.max(0, total - dpNum),
      issueDate,
      dueDate,
      status: formDocType === 'RECEIPT' || dpNum >= total ? 'PAID' : 'GENERATED',
      paymentMethod,
      deliveryDriver: deliveryDriver || undefined,
      driverPhone: driverPhone || undefined,
      deliveryVehiclePlate: vehiclePlate || undefined,
      deliveryExpedition: expedition,
      notes,
      createdBy: 'Sales / Finance Desk',
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CREATE', invoice: newInv }),
      });
      if (res.ok) {
        const createdData = await res.json();
        setShowCreateModal(false);
        // Reset form
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setCustomerCompany('');
        setSkuCode('');
        setItemDesc('');
        setUnitPrice('');
        setDiscount('0');
        setDpAmount('0');
        setNotes('');
        loadInvoices();

        if (createdData.invoice) {
          setSelectedInvoice(createdData.invoice);
          setDocumentModalType(formDocType);
          setIsDocModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Document create failed', err);
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

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.items.some((i) => i.sku.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchType = typeFilter === 'ALL' || inv.documentType === typeFilter;

      return matchQ && matchStatus && matchType;
    });
  }, [invoices, searchQuery, statusFilter, typeFilter]);

  // Overview metrics
  const totalInvoicesCount = invoices.length;
  const paidCount = invoices.filter((i) => i.status === 'PAID').length;
  const unpaidCount = invoices.filter((i) => i.status === 'GENERATED' || i.status === 'SENT').length;
  const totalValue = invoices.reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2 font-mono">
            <FileText className="w-6 h-6 text-amber-500" />
            <span>INVOICES, KUITANSI & DOKUMEN RESMI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Penerbitan faktur tagihan resmi, kuitansi pelunasan, surat penawaran, dan surat jalan pengiriman berlogo BBKitchen.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setIsRefreshing(true);
              loadInvoices();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Terbitkan Dokumen Baru</span>
          </button>
        </div>
      </div>

      {/* OVERVIEW STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-start text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Total Dokumen</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-1">
            {totalInvoicesCount} <span className="text-xs text-slate-400 font-normal">Arsip</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Total nilai: {formatIDR(totalValue)}</p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-start text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Kuitansi Lunas</span>
            <Receipt className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {paidCount} <span className="text-xs text-slate-400 font-normal">Lunas</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Pembayaran terverifikasi</p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-start text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Menunggu Pelunasan</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-400 font-mono mt-1">
            {unpaidCount} <span className="text-xs text-slate-400 font-normal">Faktur</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Status Sent / Generated</p>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex justify-between items-start text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Format Resmi</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-sm font-bold text-slate-200 mt-1">
            4 Template Standar A4
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Invoice • Kuitansi • Quotation • Surat Jalan</p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Cari no. faktur, nama pelanggan, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">Semua Jenis Dokumen</option>
            <option value="INVOICE">📄 Invoice (Faktur)</option>
            <option value="RECEIPT">🧾 Kuitansi Lunas</option>
            <option value="QUOTATION">📋 Quotation (Penawaran)</option>
            <option value="DELIVERY_NOTE">🚚 Surat Jalan</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="PAID">PAID / LUNAS</option>
            <option value="SENT">SENT (Terkirim)</option>
            <option value="GENERATED">GENERATED</option>
            <option value="DRAFT">DRAFT</option>
          </select>
        </div>
      </div>

      {/* DOCUMENT ARCHIVE TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5">No. Dokumen</th>
                <th className="py-3 px-3.5">Format</th>
                <th className="py-3 px-3.5">Nama Pelanggan</th>
                <th className="py-3 px-3.5">Rincian Item</th>
                <th className="py-3 px-3.5">Tanggal Terbit</th>
                <th className="py-3 px-3.5">Jatuh Tempo</th>
                <th className="py-3 px-3.5 text-right">Total Tagihan</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    Memuat arsip dokumen...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-slate-400 font-medium">Belum ada dokumen yang diterbitkan.</p>
                    <p className="text-[11px] text-slate-600 mt-1">
                      Klik <strong>"+ Terbitkan Dokumen Baru"</strong> atau terbitkan dari menu Sales Helper.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3 px-3.5 font-mono font-bold text-amber-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="inline-block px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[10px] font-bold text-slate-300">
                        {inv.documentType || 'INVOICE'}
                      </span>
                    </td>
                    <td className="py-3 px-3.5">
                      <p className="font-bold text-slate-200">{inv.customerName}</p>
                      <p className="text-[10px] text-slate-500">{inv.customerPhone}</p>
                    </td>
                    <td className="py-3 px-3.5 max-w-xs">
                      <p className="text-slate-300 line-clamp-1">
                        {inv.items.map((i) => i.description).join(', ')}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {inv.items.map((i) => i.sku).join(', ')}
                      </p>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-300">{inv.issueDate}</td>
                    <td className="py-3 px-3.5 font-mono text-slate-400">{inv.dueDate}</td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-white">
                      {formatIDR(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {inv.status === 'PAID' ? (
                        <span className="inline-block px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
                          ✓ LUNAS
                        </span>
                      ) : inv.status === 'SENT' ? (
                        <span className="inline-block px-2 py-0.5 bg-blue-950 text-blue-300 border border-blue-800 rounded text-[10px] font-bold">
                          SENT
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-amber-950 text-amber-300 border border-amber-800 rounded text-[10px] font-bold">
                          {inv.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setDocumentModalType(inv.documentType || 'INVOICE');
                          setIsDocModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Buka / Cetak</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW OFFICIAL DOCUMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>Penerbitan Dokumen Legal Resmi BBKitchen</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4 text-xs">
              {/* Document Type Selector */}
              <div>
                <label className="block text-slate-400 font-bold mb-1.5">Pilih Format Dokumen:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormDocType('INVOICE')}
                    className={`p-2.5 rounded-xl font-bold border text-center transition-all ${
                      formDocType === 'INVOICE'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    📄 Invoice
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormDocType('RECEIPT')}
                    className={`p-2.5 rounded-xl font-bold border text-center transition-all ${
                      formDocType === 'RECEIPT'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    🧾 Kuitansi
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormDocType('QUOTATION')}
                    className={`p-2.5 rounded-xl font-bold border text-center transition-all ${
                      formDocType === 'QUOTATION'
                        ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    📋 Quotation
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormDocType('DELIVERY_NOTE')}
                    className={`p-2.5 rounded-xl font-bold border text-center transition-all ${
                      formDocType === 'DELIVERY_NOTE'
                        ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-md shadow-orange-500/20'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    🚚 Surat Jalan
                  </button>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nama Pembeli / Owner Resto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bpk. Hendra (Resto Padang Sederhana)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">No. WhatsApp Pembeli *</label>
                  <input
                    type="text"
                    required
                    placeholder="0812-xxxx-xxxx"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Alamat Tujuan Pengiriman / Restoran</label>
                <input
                  type="text"
                  placeholder="Jl. Boulevard Gading Serpong Blok M5 No. 12, Tangerang"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Product Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Kode SKU Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="BBK1823"
                    value={skuCode}
                    onChange={(e) => setSkuCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-bold mb-1">Nama Produk & Spesifikasi *</label>
                  <input
                    type="text"
                    required
                    placeholder="Kompor 4 Tungku High Pressure Ukuran 80x90x81"
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Financial Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Harga Kesepakatan (Rp) *</label>
                  <input
                    type="number"
                    required
                    placeholder="2500000"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Diskon (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">DP Diterima (Rp)</label>
                  <input
                    type="number"
                    placeholder="0 (Isi jika DP)"
                    value={dpAmount}
                    onChange={(e) => setDpAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Driver & Expedition Info (for Surat Jalan) */}
              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
                  🚚 Detail Pengiriman (Untuk Surat Jalan)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-500 text-[10px]">Ekspedisi:</label>
                    <select
                      value={expedition}
                      onChange={(e) => setExpedition(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                    >
                      <option value="LALAMOVE">Lalamove</option>
                      <option value="DELIVEREE">Deliveree</option>
                      <option value="INTERNAL_FLEET">Armada Sendiri</option>
                      <option value="CARGO_EKSPEDISI">Kargo / Ekspedisi</option>
                      <option value="PICKUP_SENDIRI">Diambil Sendiri</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px]">Nama Driver:</label>
                    <input
                      type="text"
                      placeholder="Pak Ujang"
                      value={deliveryDriver}
                      onChange={(e) => setDeliveryDriver(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 text-[10px]">No. Polisi Kendaraan:</label>
                    <input
                      type="text"
                      placeholder="B 9482 SXZ"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20"
                >
                  Simpan & Cetak Dokumen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4-IN-1 OFFICIAL DOCUMENT PRINT & PREVIEW MODAL */}
      {selectedInvoice && (
        <OfficialDocumentModal
          invoice={selectedInvoice}
          isOpen={isDocModalOpen}
          initialType={documentModalType}
          onClose={() => setIsDocModalOpen(false)}
        />
      )}
    </div>
  );
}
