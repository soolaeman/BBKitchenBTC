'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { UserRole } from '@/lib/types/auth';
import { ShieldCheck, UserCog, Megaphone, DollarSign, Eye, TrendingUp, Lock } from 'lucide-react';

const ROLES_INFO: Array<{
  role: UserRole;
  label: string;
  desc: string;
  icon: React.ElementType;
  badgeColor: string;
}> = [
  {
    role: 'ADMIN',
    label: 'Admin (Full Access)',
    desc: 'Semua modul, modal HPP, floor margin, link Telegram & bypass guardrail',
    icon: ShieldCheck,
    badgeColor: 'bg-indigo-600 text-white',
  },
  {
    role: 'OPERATOR',
    label: 'Operator / Gudang',
    desc: 'Inventaris, Pipeline foto, Sales helper & Mark as Sold (HPP disamarkan)',
    icon: UserCog,
    badgeColor: 'bg-blue-600 text-white',
  },
  {
    role: 'MARKETING',
    label: 'Marketing & SEO',
    desc: 'SEO quality score, WordPress Posts pipeline, Social media & Analytics',
    icon: Megaphone,
    badgeColor: 'bg-emerald-600 text-white',
  },
  {
    role: 'FINANCE',
    label: 'Finance & Invoicing',
    desc: 'Laporan laba kotor, HPP agregat, manajemen faktur & status pembayaran',
    icon: DollarSign,
    badgeColor: 'bg-amber-600 text-white',
  },
  {
    role: 'VIEWER',
    label: 'Viewer (Read-Only)',
    desc: 'Akses publik dan monitoring dasar tanpa akses komersial rahasia',
    icon: Eye,
    badgeColor: 'bg-slate-600 text-white',
  },
  {
    role: 'INVESTOR',
    label: 'Investor Portal (Strict Privacy)',
    desc: 'Metrik bisnis level tinggi; data Telegram, HPP per SKU & supplier di-mask',
    icon: TrendingUp,
    badgeColor: 'bg-purple-700 text-white',
  },
];

export function RoleSwitcher() {
  const { role, switchRole, user } = useAuth();

  return (
    <div className="flex items-center gap-2">
      <div className="relative inline-block">
        <label htmlFor="role-select" className="sr-only">Switch RBAC Role</label>
        <select
          id="role-select"
          value={role}
          onChange={(e) => switchRole(e.target.value as UserRole)}
          className="bg-transparent border border-white/[0.12] text-white text-xs rounded-sm px-3 py-1.5 font-mono cursor-pointer hover:border-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
        >
          {ROLES_INFO.map((r) => (
            <option key={r.role} value={r.role} className="bg-[#141417] text-white">
              {r.role === 'ADMIN' ? 'Admin' : r.role === 'OPERATOR' ? 'Operator' : r.role === 'MARKETING' ? 'Active: MARKETING' : r.label}
            </option>
          ))}
        </select>
      </div>

      {role === 'INVESTOR' && (
        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-purple-950/80 border border-purple-800/80 text-[10px] font-mono text-purple-300">
          <Lock className="w-3 h-3 text-purple-400" />
          Masked Mode
        </span>
      )}
    </div>
  );
}
