'use client';

import { useAuth } from '@/lib/auth/auth-context';
import { SalesHelperView } from '@/components/admin/SalesHelperView';

export default function SalesPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <main className="min-h-screen bg-[#0c0c0e] text-white p-6 sm:p-10">
      <SalesHelperView />
    </main>
  );
}
