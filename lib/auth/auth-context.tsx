'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserSession, ROLE_PERMISSIONS, RolePermissions } from '@/lib/types/auth';

interface AuthContextType {
  user: UserSession | null;
  role: UserRole;
  permissions: RolePermissions;
  switchRole: (newRole: UserRole) => void;
  isLoading: boolean;
  logout: () => void;
}

const DEFAULT_USERS_BY_ROLE: Record<UserRole, UserSession> = {
  ADMIN: {
    id: 'usr_admin',
    name: 'Soolaeman (Admin & Founder)',
    email: 'borongresto@gmail.com',
    role: 'ADMIN',
    avatarUrl: 'https://picsum.photos/seed/bbk_admin/120/120',
  },
  OPERATOR: {
    id: 'usr_op',
    name: 'Budi (Warehouse & Inventory Op)',
    email: 'operator@bukanbarukitchen.com',
    role: 'OPERATOR',
    avatarUrl: 'https://picsum.photos/seed/bbk_op/120/120',
  },
  MARKETING: {
    id: 'usr_mkt',
    name: 'Sarah (SEO & Social Lead)',
    email: 'marketing@bukanbarukitchen.com',
    role: 'MARKETING',
    avatarUrl: 'https://picsum.photos/seed/bbk_mkt/120/120',
  },
  FINANCE: {
    id: 'usr_fin',
    name: 'Dewi (Finance & Invoicing)',
    email: 'finance@bukanbarukitchen.com',
    role: 'FINANCE',
    avatarUrl: 'https://picsum.photos/seed/bbk_fin/120/120',
  },
  VIEWER: {
    id: 'usr_view',
    name: 'Rian (Internal Staff / Viewer)',
    email: 'staff@bukanbarukitchen.com',
    role: 'VIEWER',
    avatarUrl: 'https://picsum.photos/seed/bbk_viewer/120/120',
  },
  INVESTOR: {
    id: 'usr_inv',
    name: 'Bapak Hendra (Angel Partner / Investor)',
    email: 'partner@investor-group.id',
    role: 'INVESTOR',
    avatarUrl: 'https://picsum.photos/seed/bbk_inv/120/120',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedRole = localStorage.getItem('bbk_active_role') as UserRole;
        if (savedRole && DEFAULT_USERS_BY_ROLE[savedRole]) {
          return savedRole;
        }
      } catch {
        // Ignore
      }
    }
    return 'ADMIN';
  });

  const [user, setUser] = useState<UserSession | null>(() => DEFAULT_USERS_BY_ROLE[role]);
  const [isLoading, setIsLoading] = useState(false);

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
    const newUser = DEFAULT_USERS_BY_ROLE[newRole];
    setUser(newUser);
    try {
      localStorage.setItem('bbk_active_role', newRole);
    } catch {
      // Ignore
    }
  };

  const logout = () => {
    switchRole('VIEWER');
  };

  const permissions = ROLE_PERMISSIONS[role];

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        switchRole,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
