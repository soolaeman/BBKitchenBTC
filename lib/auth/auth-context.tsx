"use client";

import React, { createContext, useContext } from "react";
import { useSession, signOut } from "next-auth/react";
import type { UserRole, UserSession, RolePermissions } from "@/lib/types/auth";
import { ROLE_PERMISSIONS } from "@/lib/types/auth";

interface AuthContextType {
  user: UserSession | null;
  role: UserRole | null;
  permissions: RolePermissions | null;
  switchRole: never;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const role = session?.user?.role ?? null;
  const user: UserSession | null = session?.user
    ? {
        id: session.user.email ?? "authenticated-user",
        name: session.user.name ?? "BBK User",
        email: session.user.email ?? "",
        role: role ?? "VIEWER",
        avatarUrl: session.user.image ?? undefined,
      }
    : null;

  const value: AuthContextType = {
    user,
    role,
    permissions: role ? ROLE_PERMISSIONS[role] : null,
    switchRole: undefined as never,
    isLoading: status === "loading",
    logout: () => signOut({ callbackUrl: "/login" }),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
