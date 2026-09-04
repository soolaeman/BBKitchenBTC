'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Invoice, InvoiceItem, InvoiceStatus, DocumentType } from '@/lib/types/finance';
import { MasterInventoryItem } from '@/lib/types/inventory';
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
  Trash2,
  X,
  ExternalLink,
} from 'lucide-react';

interface DocumentItemRow {
  id: string;
  sku: string;
  description: string;
  quantity: number;
  unitPrice: number;
  warehouseLocation?: string;
  condition?: string;
}

const EXPEDITION_OPTIONS = [
  { value: 'LALAMOVE', label: 'Lalamove' },
  { value: 'DELIVEREE', label: 'Deliveree' },
  { value: 'INTERNAL_FLEET', label: 'Armada Sendiri (BBKitchen)' },
  { value: 'SENTRAL_CARGO', label: 'Sentral Cargo' },
  { value: 'INDAH_DAKOTA', label: 'Indah Logistik / Dakota Cargo' },
  { value: 'GOJEK_GRAB', label: 'Gojek / Grab Instant' },
  { value: 'PICKUP_SENDIRI', label: 'Diambil Sendiri (Self Pick-up)' },
  { value: 'CUSTOM', label: 'Lainnya / Tulis Manual...' },
] as const;

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

  // New Document Form States
  const [formDocType, setFormDocType] = useState<DocumentType>('INVOICE');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');

  // Multi-Item Rows
  const [itemRows, setItemRows] = useState<DocumentItemRow[]>([
    { id: 'item_1', sku: '', description: '', quantity: 1, unitPrice: 0 },
  ]);

  // Live SKU Search States for rows
  const [activeSearchRowId, setActiveSearchRowId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<MasterInventoryItem[]>([]);
  const [isSearchingInventory, setIsSearchingInventory] = useState(false);

  // Financial States
  const [discount, setDiscount] = useState<string>('0');
  const [dpAmount, setDpAmount] = useState<string>('0');
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER_BCA' | 'TRANSFER_MANDIRI' | 'CASH_PICKUP'>('TRANSFER_BCA');

  // Logistics / Driver States
  const [expeditionChoice, setExpeditionChoice] = useState<string>('LALAMOVE');
  const [customExpeditionText, setCustomExpeditionText] = useState('');
  const [deliveryDriver, setDeliveryDriver] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [notes, setNotes] = useState('');

  const loadInvoices = useCallback(async () => {
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

  // Handle Multi-Item Operations
  const addItemRow = () => {
    const newId = `item_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    setItemRows((prev) => [
      ...prev,
      { id: newId, sku: '', description: '', quantity: 1, unitPrice: 0 },
    ]);
  };

  const removeItemRow = (id: string) => {
    if (itemRows.length <= 1) {
      // Don't remove if it's the last row, just clear it
      setItemRows([{ id: 'item_1', sku: '', description: '', quantity: 1, unitPrice: 0 }]);
      return;
    }
    setItemRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateItemRow = (id: string, field: keyof DocumentItemRow, val: any) => {
    setItemRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: val };
        }
        return r;
      })
    );
  };

  // Live Auto-Search Catalog when typing SKU / Title
  const handleSearchSku = async (rowId: string, query: string) => {
    updateItemRow(rowId, 'sku', query);
    setActiveSearchRowId(rowId);

    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearchingInventory(true);
    try {
      const res = await fetch(`/api/inventory?search=${encodeURIComponent(query.trim())}&pageSize=6`);
      const data = await res.json();
      if (data.items) {
        setSearchResults(data.items);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearchingInventory(false);
    }
  };

  // Select Item from Live Search
  const handleSelectSearchedItem = (rowId: string, item: MasterInventoryItem) => {
    setItemRows((prev) =>
      prev.map((r) => {
        if (r.id === rowId) {
          return {
            ...r,
            sku: item.SKU,
            description: item.PRODUCT_TITLE,
            unitPrice: item.HARGA_BUKA_WA || item.HARGA_ESTIMASI_PUBLIK || 0,
            warehouseLocation: item.LOKASI_UNIT || item.asal_gudang,
            condition: item.KONDISI_FISIK || 'Bekas Siap Pakai (Lolos QC)',
          };
        }
        return r;
      })
    );
    setActiveSearchRowId(null);
    setSearchResults([]);
  };

  // Calculations
  const calculatedSubtotal = useMemo(() => {
    return itemRows.reduce((sum, it) => sum + (Number(it.quantity) || 1) * (Number(it.unitPrice) || 0), 0);
  }, [itemRows]);

  const discNum = Number(discount.replace(/\D/g, '')) || 0;
  const calculatedTotal = Math.max(0, calculatedSubtotal - discNum);
  const dpNum = Number(dpAmount.replace(/\D/g, '')) || 0;
  const calculatedSisa = Math.max(0, calculatedTotal - dpNum);

  // Submit & Create Document
  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanItems: InvoiceItem[] = itemRows.map((r, idx) => {
      const q = Math.max(1, Number(r.quantity) || 1);
      const p = formDocType === 'DELIVERY_NOTE' ? 0 : Number(r.unitPrice) || 0;
      return {
        id: r.id || `item_${idx}_${Date.now()}`,
        sku: r.sku.trim() || `BBK-CUSTOM-${idx + 1}`,
        description: r.description.trim() || 'Peralatan Dapur Komersial Restoran',
        quantity: q,
        unitPrice: p,
        total: q * p,
        warehouseLocation: r.warehouseLocation,
        condition: r.condition,
      };
    });

    const now = new Date();
    const issueDate = now.toISOString().split('T')[0];
    const dueDateObj = new Date(now);
    dueDateObj.setDate(dueDateObj.getDate() + 3);
    const dueDate = dueDateObj.toISOString().split('T')[0];
    const randomNum = Math.floor(1000 + Math.random() * 9000);

    const resolvedExpedition =
      expeditionChoice === 'CUSTOM'
        ? customExpeditionText.trim() || 'Ekspedisi Rekanan'
        : EXPEDITION_OPTIONS.find((o) => o.value === expeditionChoice)?.label || expeditionChoice;

    const newInv: Omit<Invoice, 'id'> = {
      invoiceNumber: `INV-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${randomNum}`,
      kuitansiNumber: `KWT-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${randomNum}`,
      quotationNumber: `QUO-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${randomNum}`,
      suratJalanNumber: `SJ-BBK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${randomNum}`,
      documentType: formDocType,
      customerName: customerName.trim() || 'Bpk/Ibu Owner Resto',
      customerPhone: customerPhone.trim() || '08xx-xxxx-xxxx',
      customerAddress: customerAddress.trim(),
      customerCompany: customerCompany.trim(),
      orderReference: `ORD-WA-${Date.now().toString().slice(-6)}`,
      items: cleanItems,
      subtotal: calculatedSubtotal,
      discount: discNum,
      tax: 0,
      totalAmount: calculatedTotal,
      dpAmount: formDocType === 'RECEIPT' ? calculatedTotal : dpNum,
      remainingAmount: formDocType === 'RECEIPT' ? 0 : calculatedSisa,
      issueDate,
      dueDate,
      status: formDocType === 'RECEIPT' || dpNum >= calculatedTotal ? 'PAID' : 'GENERATED',
      paymentMethod,
      deliveryDriver: deliveryDriver.trim() || undefined,
      driverPhone: driverPhone.trim() || undefined,
      deliveryVehiclePlate: vehiclePlate.trim() || undefined,
      deliveryExpedition: resolvedExpedition,
      notes: notes.trim(),
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
        setItemRows([{ id: 'item_1', sku: '', description: '', quantity: 1, unitPrice: 0 }]);
        setDiscount('0');
        setDpAmount('0');
        setDeliveryDriver('');
        setDriverPhone('');
        setVehiclePlate('');
        setNotes('');
        loadInvoices();

        if (createdData.invoice) {
          setSelectedInvoice(createdData.invoice);
          setDocumentModalType(formDocType);
          setIsDocModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Document creation failed', err);
    }
  };

  // Filter invoices for list
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
      const matchType = typeFilter === 'ALL' || inv.documentType === typeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        (inv.customerPhone && inv.customerPhone.toLowerCase().includes(q)) ||
        inv.items.some((i) => i.description.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));

      return matchStatus && matchType && matchQ;
    });
  }, [invoices, statusFilter, typeFilter, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-950 border border-amber-800 text-amber-400">
            <Receipt className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-xl font-black text-slate-100 tracking-tight flex items-center gap-2">
              INVOICES & DOKUMEN RESMI
              <span className="px-2 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-mono font-bold">
                4-in-1 Generator
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Faktur Tagihan (Invoice), Kuitansi Lunas, Surat Penawaran (Quotation) & Surat Jalan Tanpa Harga.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadInvoices}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh Arsip Dokumen"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => {
              setItemRows([{ id: 'item_1', sku: '', description: '', quantity: 1, unitPrice: 0 }]);
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-950/50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ Terbitkan Dokumen Baru</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block text-slate-400 font-bold mb-1">🔍 Cari Dokumen:</label>
          <input
            type="text"
            placeholder="Cari No. Dokumen, Pembeli, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-bold mb-1">📄 Format Dokumen:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold text-xs"
          >
            <option value="ALL">Semua Format Dokumen</option>
            <option value="INVOICE">📄 Invoice (Faktur)</option>
            <option value="RECEIPT">🧾 Kuitansi Pembayaran</option>
            <option value="QUOTATION">📋 Quotation (Penawaran)</option>
            <option value="DELIVERY_NOTE">🚚 Surat Jalan (Delivery)</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-bold mb-1">📌 Status Transaksi:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-semibold text-xs"
          >
            <option value="ALL">Semua Status</option>
            <option value="PAID">✓ Lunas</option>
            <option value="GENERATED">Terbit (Unpaid)</option>
            <option value="SENT">Terkirim</option>
          </select>
        </div>
      </div>

      {/* ARSIP DOKUMEN TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            ARSIP DOKUMEN TRANSAKSI ({filteredInvoices.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3.5">No. Dokumen</th>
                <th className="py-3 px-3.5">Format</th>
                <th className="py-3 px-3.5">Nama Pelanggan</th>
                <th className="py-3 px-3.5">Rincian Unit</th>
                <th className="py-3 px-3.5">Tanggal Terbit</th>
                <th className="py-3 px-3.5 text-right">Total Transaksi</th>
                <th className="py-3 px-3.5 text-center">Status</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    Memuat arsip dokumen...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    Belum ada dokumen yang diterbitkan.
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
                      <p className="text-[10px] text-slate-500 font-mono">{inv.customerPhone}</p>
                    </td>
                    <td className="py-3 px-3.5 max-w-xs">
                      <p className="text-slate-300 line-clamp-1">
                        {inv.items.map((i) => i.description).join(', ')}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {inv.items.map((i) => `${i.sku} (${i.quantity} unit)`).join(', ')}
                      </p>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-slate-300">{inv.issueDate}</td>
                    <td className="py-3 px-3.5 text-right font-mono font-bold text-white">
                      {formatIDR(inv.totalAmount)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {inv.status === 'PAID' ? (
                        <span className="inline-block px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-bold">
                          ✓ LUNAS
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

      {/* CREATE NEW OFFICIAL DOCUMENT MODAL WITH MULTI-ITEM & AUTO-SEARCH */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-950 border border-amber-800 text-amber-400">
                  <FileText className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-white">
                    Penerbitan Dokumen Legal Resmi BBKitchen
                  </h3>
                  <p className="text-xs text-slate-400">
                    Mendukung multi-unit, pencarian otomatis stok live, dan surat jalan tanpa harga.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-5 text-xs">
              {/* 1. DOCUMENT TYPE SELECTOR */}
              <div>
                <label className="block text-slate-400 font-bold mb-1.5 uppercase text-[10px] tracking-wider">
                  Pilih Format Dokumen:
                </label>
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

              {/* 2. CUSTOMER & DESTINATION INFO */}
              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                  👤 Informasi Pembeli & Alamat Pengiriman
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Nama Pembeli / Owner Resto *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bpk. Hendra (Resto Padang Sederhana)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      No. WhatsApp Pembeli *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="0812-xxxx-xxxx"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    Alamat Lengkap Pengiriman / Restoran
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Jl. Boulevard Gading Serpong Blok M5 No. 12, Tangerang"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* 3. MULTI-UNIT ITEMS BUILDER WITH AUTO-SEARCH */}
              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                    📦 Daftar Unit Barang ({itemRows.length} Unit)
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg font-bold text-[11px] border border-amber-500/30 flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Baris Unit</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {itemRows.map((row, index) => (
                    <div
                      key={row.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 relative"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-400">Unit #{index + 1}</span>
                        {itemRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemRow(row.id)}
                            className="text-slate-500 hover:text-rose-400 p-1"
                            title="Hapus baris unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        {/* SKU Search Input */}
                        <div className="sm:col-span-3 relative">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                            Kode SKU (Auto Search) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ketik BBK..."
                            value={row.sku}
                            onChange={(e) => handleSearchSku(row.id, e.target.value.toUpperCase())}
                            onFocus={() => {
                              if (row.sku.length >= 2) handleSearchSku(row.id, row.sku);
                            }}
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-amber-400 font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500"
                          />

                          {/* Autocomplete Dropdown List */}
                          {activeSearchRowId === row.id && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-800">
                              {searchResults.map((item) => (
                                <button
                                  key={item.SKU}
                                  type="button"
                                  onClick={() => handleSelectSearchedItem(row.id, item)}
                                  className="w-full text-left p-2 hover:bg-slate-800 flex items-center justify-between gap-2 transition-colors"
                                >
                                  <div className="truncate">
                                    <div className="font-mono font-bold text-amber-400 text-[11px]">
                                      {item.SKU} • {item.asal_gudang || item.LOKASI_UNIT}
                                    </div>
                                    <div className="text-[10px] text-slate-200 truncate">
                                      {item.PRODUCT_TITLE}
                                    </div>
                                  </div>
                                  <span className="font-mono text-emerald-400 font-bold text-[10px] whitespace-nowrap">
                                    {item.HARGA_BUKA_WA ? formatIDR(item.HARGA_BUKA_WA) : 'Cek Harga'}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Product Title Input */}
                        <div className={`${formDocType === 'DELIVERY_NOTE' ? 'sm:col-span-7' : 'sm:col-span-5'}`}>
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                            Nama Produk & Spesifikasi *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Deskripsi nama produk..."
                            value={row.description}
                            onChange={(e) => updateItemRow(row.id, 'description', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        {/* Qty Input */}
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                            Jumlah (Qty) *
                          </label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={row.quantity}
                            onChange={(e) => updateItemRow(row.id, 'quantity', Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-bold text-xs text-center focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        {/* Unit Price (ONLY FOR INVOICE / RECEIPT / QUOTATION - HIDDEN IN SURAT JALAN) */}
                        {formDocType !== 'DELIVERY_NOTE' && (
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                              Harga Kesepakatan (Rp) *
                            </label>
                            <input
                              type="number"
                              required
                              placeholder="0"
                              value={row.unitPrice || ''}
                              onChange={(e) => updateItemRow(row.id, 'unitPrice', Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-emerald-400 font-mono font-bold text-xs focus:ring-1 focus:ring-amber-500 text-right"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. FINANCIAL TOTALS (HIDDEN FOR SURAT JALAN!) */}
              {formDocType !== 'DELIVERY_NOTE' ? (
                <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] block">
                    💰 Rincian Nilai Finansial
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">
                        Subtotal Unit (Otomatis):
                      </label>
                      <div className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold">
                        {formatIDR(calculatedSubtotal)}
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">
                        Diskon Kesepakatan (Rp):
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-rose-400 font-mono font-bold focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">
                        Total Tagihan Akhir:
                      </label>
                      <div className="px-3 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-amber-400 font-mono font-black text-sm">
                        {formatIDR(calculatedTotal)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">
                        DP Diterima (Rp) <span className="text-[10px] text-slate-500 font-normal">(Kosongkan jika belum DP / Isi full jika Lunas)</span>:
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formDocType === 'RECEIPT' ? calculatedTotal : dpAmount}
                        disabled={formDocType === 'RECEIPT'}
                        onChange={(e) => setDpAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">
                        Metode Pembayaran Rekening:
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-semibold"
                      >
                        <option value="TRANSFER_BCA">BCA (883-129-4821 - Soolaeman)</option>
                        <option value="TRANSFER_MANDIRI">Mandiri (164-00-049281-2 - BBKitchen)</option>
                        <option value="CASH_PICKUP">Tunai di Tempat / Pick-up</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-orange-950/40 border border-orange-800/60 rounded-xl text-orange-300 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>
                    <strong>Format Surat Jalan:</strong> Harga transaksi dan rincian finansial disembunyikan otomatis demi privasi & verifikasi logistik lapangan.
                  </span>
                </div>
              )}

              {/* 5. LOGISTICS & DELIVERY DETAILS */}
              <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-3">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] block">
                  🚚 Detail Ekspedisi & Driver Pengiriman
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Pilihan Ekspedisi:
                    </label>
                    <select
                      value={expeditionChoice}
                      onChange={(e) => setExpeditionChoice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                    >
                      {EXPEDITION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Nama Driver / Kurir:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Pak Ujang"
                      value={deliveryDriver}
                      onChange={(e) => setDeliveryDriver(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      No. Polisi Kendaraan:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: B 9482 SXZ"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 font-mono"
                    />
                  </div>
                </div>

                {expeditionChoice === 'CUSTOM' && (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Nama Ekspedisi Kustom:
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Mobil Pick-up Mas Joko / Baraka Sarana Tama"
                      value={customExpeditionText}
                      onChange={(e) => setCustomExpeditionText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200"
                    />
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-950/50"
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
