'use client';

import React, { useState } from 'react';
import { AuthProvider } from '@/lib/auth/auth-context';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
        {/* Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
          <AdminHeader onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
