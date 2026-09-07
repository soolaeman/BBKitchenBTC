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

const CAPABILITIES: Array<[keyof RolePermissions, string]> = [
  ['canViewFinanceReports', 'Finance reports'],
  ['canManageInvoices', 'Manage invoices'],
  ['canEditInventory', 'Edit inventory'],
  ['canMarkAsSold', 'Mark inventory as sold'],
  ['canEditSEO', 'Edit SEO'],
  ['canManageSocialMedia', 'Manage social media'],
  ['canViewInternalCost', 'Internal cost'],
  ['canViewSupplierData', 'Supplier data'],
];

const STORAGE_KEY = 'bbk_role_permissions_overrides';

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
      [role]: { ...(current[role] || {}), [key]: value },
    }));
    setSaved(false);
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
        <table className="w-full min-w-[900px] text-left">
          <thead className="border-b border-white/[0.08] bg-white/[0.02]">
            <tr>
              <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-white/40">Role</th>
              {CAPABILITIES.map(([, label]) => (
                <th key={label} className="px-3 py-3 text-[10px] uppercase tracking-wider text-white/40">{label}</th>
              ))}
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
                  {CAPABILITIES.map(([key]) => (
                    <td key={key} className="px-3 py-4 align-top">
                      <button
                        type="button"
                        disabled={ownerRow}
                        onClick={() => updatePermission(role, key, !permissions[key])}
                        className={`rounded-md p-1.5 transition-colors ${ownerRow ? 'cursor-not-allowed opacity-40' : 'hover:bg-white/[0.06]'}`}
                        aria-label={`${role}: ${key}`}
                        title={ownerRow ? 'Owner selalu full access' : `Toggle ${key}`}
                      >
                        {permissions[key] ? (
                          <Check className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <X className="h-4 w-4 text-white/20" />
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">
        Perubahan disimpan di browser ini. API/server authorization tetap menjadi pengaman utama.
      </p>
    </section>
  );
}
