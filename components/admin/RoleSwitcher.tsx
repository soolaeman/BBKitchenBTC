'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { signOut } from 'next-auth/react';

export function RoleSwitcher() {
  const { role, user } = useAuth();

  if (!role) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono text-white/60">
        {role}
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="rounded-sm border border-white/[0.12] px-3 py-1.5 text-xs font-mono text-white/70 hover:text-white hover:border-white/30"
      >
        Sign out
      </button>
    </div>
  );
}
