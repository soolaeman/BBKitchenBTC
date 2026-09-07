'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Check, X, RotateCcw, Save } from 'lucide-react';
import { ROLE_PERMISSIONS, type RolePermissions, type UserRole } from '@/lib/types/auth';

const ROLE_ORDER: UserRole[] = [
  'ADMIN',
  'FINANCE',
  'OPERATOR',
  'MARKETING',
  'INVESTOR',
  'VIEWER',
];

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: 'Owner / full control.',
  FINANCE: 'Finance and invoice operations.',
  OPERATOR: 'Inventory, warehouse, and operational workflow.',
  MARKETING: 'SEO, social distribution, and analytics.',
  INVESTOR: 'Finance reporting with restricted operational detail.',
  VIEWER: 'Read-only dashboard access.',
};

const CAPABILITIES: Array<{
  label: string;
  viewKey: keyof RolePermissions;
  editKey?: keyof RolePermissions;
}> = [
  { label: 'Executive Overview', viewKey: 'canViewFinanceReports' },
  { label: 'Master Inventory', viewKey: 'canEditInventory', editKey: 'canEditInventory' },
  { label: 'Sales & WA Pitch', viewKey: 'canViewDealPrice' },
  { label: 'Pipeline & QC Funnel', viewKey: 'canViewTelegramLink' },
  { label: 'Invoices & Dokumen Resmi', viewKey: 'canManageInvoices', editKey: 'canManageInvoices' },
  { label: 'Financials & Cashflow', viewKey: 'canViewFinanceReports' },
  { label: 'Warehouse Intelligence', viewKey: 'canViewSupplierData' },
  { label: 'SEO Quality & Schema', viewKey: 'canEditSEO', editKey: 'canEditSEO' },
  { label: 'Social Distribution', viewKey: 'canManageSocialMedia', editKey: 'canManageSocialMedia' },
];

type Overrides = Partial<Record<UserRole, Partial<RolePermissions>>>;

function readOverrides(): Overrides {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function effectivePermissions(role: UserRole, overrides: Overrides): RolePermissions {
  return { ...ROLE_PERMISSIONS[role], ...(overrides[role] || {}) };
}

export function RoleManagement() {
  const [overrides, setOverrides] = useState<Overrides>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setOverrides(readOverrides());
  }, []);

  const updatePermission = (role: UserRole, key: keyof RolePermissions, value: boolean) => {
    setOverrides((current) => ({
      ...current,
      [role]: {
        ...(current[role] || {}),
        [key]: value,
      },
    }));
    setSaved(false);
  };

  const toggleView = (role: UserRole, key: keyof RolePermissions, value: boolean) => {
    updatePermission(role, key, value);
  };

  const toggleEdit = (role: UserRole, viewKey: keyof RolePermissions, editKey: keyof RolePermissions, value: boolean) => {
    // Edit cannot exist without View.
    const next = value ? true : false;
    updatePermission(role, editKey, next);
    if (value) updatePermission(role, viewKey, true);
  };

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    setSaved(true);
    window.dispatchEvent(new Event('bbk-role-permissions-changed'));
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setOverrides({});
    setSaved(true);
    window.dispatchEvent(new Event('bbk-role-permissions-changed'));
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-emerald-900/40 bg-[#141417] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Role</h2>
              <p className="mt-1 text-xs leading-5 text-white/50">
                Owner-only control panel. Atur hak lihat/akses operasional per role dan simpan kapan saja.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-white/60 hover:bg-white/[0.04] hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={save}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-bold text-white hover:bg-emerald-500"
            >
              <Save className="h-3.5 w-3.5" />
              {saved ? 'Tersimpan' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#141417]">
        <table className="w-full min-w-[1100px] text-left">
          <thead className="border-b border-white/[0.08] bg-white/[0.02]">
            <tr>
              <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-white/40">Role</th>
              {CAPABILITIES.map((cap) => (
                <th key={cap.label} colSpan={2} className="border-l border-white/[0.06] px-3 py-3 text-center text-[10px] uppercase tracking-wider text-white/40">
                  {cap.label}
                </th>
              ))}
            </tr>
            <tr className="border-b border-white/[0.05] bg-white/[0.015]">
              <th />
              {CAPABILITIES.flatMap((cap) => [
                <th key={cap.label + '-view'} className="border-l border-white/[0.06] px-2 py-2 text-[9px] text-white/30">Lihat</th>,
                <th key={cap.label + '-edit'} className="px-2 py-2 text-[9px] text-white/30">Edit</th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {ROLE_ORDER.map((role) => {
              const permissions = effectivePermissions(role, overrides);
              const ownerRow = role === 'ADMIN';

              return (
                <tr key={role} className="border-b border-white/[0.06] last:border-0">
                  <td className="px-4 py-4 align-top">
                    <div className="font-mono text-xs font-bold text-white">{role}</div>
                    <div className="mt-1 max-w-[180px] text-[11px] leading-4 text-white/40">{ROLE_DESCRIPTIONS[role]}</div>
                    {ownerRow && <div className="mt-2 inline-block rounded bg-emerald-950/60 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-300">Owner</div>}
                  </td>
                  {CAPABILITIES.flatMap((cap) => {
                    const canView = permissions[cap.viewKey];
                    const canEdit = cap.editKey ? permissions[cap.editKey] : false;
                    return [
                      <td key={cap.label + '-view'} className="border-l border-white/[0.06] px-2 py-4 text-center">
                        <button
                          type="button"
                          disabled={ownerRow}
                          onClick={() => toggleView(role, cap.viewKey, !canView)}
                          className={`rounded-md px-2 py-1 text-[10px] font-bold ${ownerRow ? 'cursor-not-allowed opacity-40' : 'hover:bg-white/[0.06]'}`}
                          title={ownerRow ? 'Owner selalu full access' : 'Toggle hak lihat'}
                        >
                          {canView ? <Check className="mx-auto h-4 w-4 text-emerald-400" /> : <X className="mx-auto h-4 w-4 text-white/20" />}
                        </button>
                      </td>,
                      <td key={cap.label + '-edit'} className="px-2 py-4 text-center">
                        {cap.editKey ? (
                          <button
                            type="button"
                            disabled={ownerRow}
                            onClick={() => toggleEdit(role, cap.viewKey, cap.editKey!, !canEdit)}
                            className={`rounded-md px-2 py-1 text-[10px] font-bold ${ownerRow ? 'cursor-not-allowed opacity-40' : 'hover:bg-white/[0.06]'}`}
                            title={ownerRow ? 'Owner selalu full access' : 'Toggle hak edit'}
                          >
                            {canEdit ? <Check className="mx-auto h-4 w-4 text-emerald-400" /> : <X className="mx-auto h-4 w-4 text-white/20" />}
                          </button>
                        ) : (
                          <span className="text-[10px] text-white/15">—</span>
                        )}
                      </td>,
                    ];
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">
        Edit otomatis mengaktifkan Lihat. Mematikan Lihat juga mematikan Edit. Pengaturan saat ini tersimpan di browser ini; server authorization tetap menjadi pengaman utama.
      </p>
    </section>
  );
}
