'use client';

import React from 'react';
import { ShieldCheck, Check, X } from 'lucide-react';
import { ROLE_PERMISSIONS, type UserRole } from '@/lib/types/auth';

const ROLE_ORDER: UserRole[] = [
  'ADMIN',
  'FINANCE',
  'OPERATOR',
  'MARKETING',
  'INVESTOR',
  'VIEWER',
];

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: 'Full control across the Control Tower.',
  FINANCE: 'Finance and invoice operations.',
  OPERATOR: 'Inventory, warehouse, and operational workflow.',
  MARKETING: 'SEO, social distribution, and analytics.',
  INVESTOR: 'Finance reporting with restricted operational detail.',
  VIEWER: 'Read-only dashboard access.',
};

const CAPABILITIES = [
  ['canViewFinanceReports', 'Finance reports'],
  ['canManageInvoices', 'Manage invoices'],
  ['canEditInventory', 'Edit inventory'],
  ['canMarkAsSold', 'Mark inventory as sold'],
  ['canEditSEO', 'Edit SEO'],
  ['canManageSocialMedia', 'Manage social media'],
  ['canViewInternalCost', 'Internal cost'],
  ['canViewSupplierData', 'Supplier data'],
] as const;

export function RoleManagement() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-white/[0.08] bg-[#141417] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Role Access Control</h2>
            <p className="mt-1 text-xs leading-5 text-white/50">
              Read-only view of the permissions attached to each BBKitchen role.
              Google remains the authentication provider; role assignment stays server-side.
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/[0.08] bg-[#141417]">
        <table className="w-full min-w-[760px] text-left">
          <thead className="border-b border-white/[0.08] bg-white/[0.02]">
            <tr>
              <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-white/40">Role</th>
              {CAPABILITIES.map(([, label]) => (
                <th key={label} className="px-3 py-3 text-[10px] uppercase tracking-wider text-white/40">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROLE_ORDER.map((role) => {
              const permissions = ROLE_PERMISSIONS[role];
              return (
                <tr key={role} className="border-b border-white/[0.06] last:border-0">
                  <td className="px-4 py-4 align-top">
                    <div className="font-mono text-xs font-bold text-white">{role}</div>
                    <div className="mt-1 max-w-[180px] text-[11px] leading-4 text-white/40">
                      {ROLE_DESCRIPTIONS[role]}
                    </div>
                  </td>
                  {CAPABILITIES.map(([key]) => {
                    const enabled = permissions[key];
                    return (
                      <td key={key} className="px-3 py-4 align-top">
                        {enabled ? (
                          <Check className="h-4 w-4 text-emerald-400" aria-label="Allowed" />
                        ) : (
                          <X className="h-4 w-4 text-white/20" aria-label="Not allowed" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] font-mono uppercase tracking-wider text-white/30">
        Role assignment is not editable from this tab.
      </p>
    </section>
  );
}
