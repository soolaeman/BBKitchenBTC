'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/auth-context';
import { RoleSwitcher } from '@/components/admin/RoleSwitcher';
import { OverviewDashboard } from '@/components/admin/OverviewDashboard';
import { InventoryTable } from '@/components/admin/InventoryTable';
import { PipelineMonitor } from '@/components/admin/PipelineMonitor';
import { InvoiceManager } from '@/components/admin/InvoiceManager';
import { FinanceDashboard } from '@/components/admin/FinanceDashboard';
import { WarehouseIntelligence } from '@/components/admin/WarehouseIntelligence';
import { SEOQualityControl } from '@/components/admin/SEOQualityControl';
import { SocialMediaCenter } from '@/components/admin/SocialMediaCenter';
import { SalesHelperView } from '@/components/admin/SalesHelperView';
import {
  LayoutDashboard,
  Boxes,
  Workflow,
  Receipt,
  TrendingUp,
  Warehouse,
  SearchCheck,
  Share2,
  Calculator,
  MessageSquare,
  Shield,
  ChefHat,
  ArrowUpRight,
  ExternalLink,
  Bell,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

type AdminTab =
  | 'OVERVIEW'
  | 'INVENTORY'
  | 'PIPELINE'
  | 'INVOICES'
  | 'FINANCE'
  | 'WAREHOUSES'
  | 'SEO'
  | 'SOCIAL'
  | 'SALES_QUOTE'
  | 'SALES_HELPER';

export default function AdminPage() {
  const { user, role, permissions } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const router = useRouter();

  if (!user) return null;

  const navItems: {
    id: AdminTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    allowed: boolean;
  }[] = [
    {
      id: 'OVERVIEW',
      label: 'Executive Overview',
      icon: <LayoutDashboard className="w-4 h-4" />,
      allowed: true,
    },
    {
      id: 'INVENTORY',
      label: 'Master Inventory',
      icon: <Boxes className="w-4 h-4" />,
      badge: 'Live',
      allowed: true,
    },
    {
      id: 'SALES_HELPER',
      label: '⚡ Sales & WA Pitch',
      icon: <MessageSquare className="w-4 h-4 text-emerald-400" />,
      badge: 'Sprint 2A',
      allowed: true,
    },
    {
      id: 'PIPELINE',
      label: 'Pipeline & QC Funnel',
      icon: <Workflow className="w-4 h-4" />,
      badge: '5 Stages',
      allowed: permissions.canEditInventory,
    },
    {
      id: 'INVOICES',
      label: 'Invoices & Billing',
      icon: <Receipt className="w-4 h-4" />,
      allowed: permissions.canManageInvoices,
    },
    {
      id: 'FINANCE',
      label: 'Financials & Margins',
      icon: <TrendingUp className="w-4 h-4" />,
      allowed: permissions.canViewFinanceReports,
    },
    {
      id: 'WAREHOUSES',
      label: 'Warehouse Intelligence',
      icon: <Warehouse className="w-4 h-4" />,
      badge: '5 Hubs',
      allowed: true,
    },
    {
      id: 'SEO',
      label: 'SEO Quality & Schema',
      icon: <SearchCheck className="w-4 h-4" />,
      allowed: permissions.canEditSEO,
    },
    {
      id: 'SOCIAL',
      label: 'Social Distribution',
      icon: <Share2 className="w-4 h-4" />,
      allowed: permissions.canManageSocialMedia,
    },
    {
      id: 'SALES_QUOTE',
      label: 'Sales Quote',
      icon: <Calculator className="w-4 h-4" />,
      allowed: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0c0c0e] text-white flex flex-col font-sans">
      {/* Top Bar for Role Switching & System Status */}
      <div className="bg-[#141417] border-b border-white/[0.08] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-white tracking-wider font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>BUKAN BARU KITCHEN • ENTERPRISE CONTROL TOWER</span>
          </div>
          <span className="text-white/20 hidden md:inline">|</span>
          <span className="text-white/60 hidden md:inline font-mono text-[11px]">
            Active Role: <strong className="text-[#3b82f6]">{role}</strong>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <RoleSwitcher />
          <Link
            href="/"
            className="text-white/60 hover:text-white flex items-center gap-1 font-mono text-xs transition-colors"
          >
            <span>Public Catalog</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Main App Container with Sidebar Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Executive Sidebar */}
        <aside className="w-full lg:w-72 bg-[#141417] border-r border-white/[0.08] flex flex-col justify-between shrink-0 p-6">
          <div className="space-y-6">
            {/* Brand Header */}
            <div className="brand mb-6">
              <h2 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">
                BBKitchen
              </h2>
              <p className="font-mono text-[10px] text-white/60 tracking-widest mt-1.5 uppercase">
                OS v2.4.0 • Enterprise Control Tower
              </p>
            </div>

            {/* Navigation items */}
            <nav className="space-y-1">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#3b82f6] mb-3 block font-semibold">
                Navigation
              </span>
              {navItems.map((item) => {
                if (!item.allowed) return null;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => item.id === 'SALES_QUOTE' ? router.push('/admin/sales') : setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium transition-all rounded-sm ${
                      isActive
                        ? 'text-[#3b82f6] font-semibold bg-white/[0.04]'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <span className={isActive ? 'text-[#3b82f6]' : 'text-white/50'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${
                          isActive
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800/80'
                            : 'bg-black/30 text-white/40 border border-white/[0.06]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* User Profile Badge at Sidebar Bottom */}
          <div className="profile border-t border-white/[0.08] pt-5 mt-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#3b82f6] rounded-sm flex items-center justify-center font-bold text-white text-xs">
              {user?.name ? user.name[0] : 'S'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || 'Sarah'}
              </p>
              <p className="text-[10px] text-white/60 font-mono truncate">
                {role === 'MARKETING' ? 'SEO & Social Lead' : role}
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col bg-[#0c0c0e] min-w-0">
          {/* Header Bar */}
          <header className="h-20 bg-[#0c0c0e] border-b border-white/[0.08] flex items-center justify-between px-6 sm:px-10">
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight uppercase">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h1>
              <p className="text-[10px] text-white/60 uppercase tracking-widest font-mono mt-0.5">
                Real-time Multi-Warehouse Sync • Jabodetabek Hubs
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 border border-white/[0.08] rounded-full text-[11px] font-mono text-white/60">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span>2,700+ Stock Sync</span>
              </div>
            </div>
          </header>

          {/* Body Content Scrollable Container */}
          <div className="flex-1 p-6 sm:p-10 space-y-6 overflow-y-auto">
            {activeTab === 'OVERVIEW' && <OverviewDashboard />}
            {activeTab === 'INVENTORY' && <InventoryTable />}
            {activeTab === 'PIPELINE' && <PipelineMonitor />}
            {activeTab === 'INVOICES' && <InvoiceManager />}
            {activeTab === 'FINANCE' && <FinanceDashboard />}
            {activeTab === 'WAREHOUSES' && <WarehouseIntelligence />}
            {activeTab === 'SEO' && <SEOQualityControl />}
            {activeTab === 'SOCIAL' && <SocialMediaCenter />}
            {activeTab === 'SALES_HELPER' && <SalesHelperView />}
          </div>
        </main>
      </div>
    </div>
  );
}
