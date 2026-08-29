"use client";

import React, { createContext, useContext } from "react";
import { useSession, signOut } from "next-auth/react";
import type { UserRole, UserSession, RolePermissions } from "@/lib/types/auth";
import { ROLE_PERMISSIONS } from "@/lib/types/auth";

interface AuthContextType {
  user: UserSession | null;
  role: UserRole;
  permissions: RolePermissions;
  switchRole: never;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // VIEWER is the safe client-side default while the session is loading.
  // Authentication/authorization is enforced server-side by auth(), never by this default.
  const role: UserRole = session?.user?.role ?? "VIEWER";
  const user: UserSession | null = session?.user
    ? {
        id: session.user.email ?? "authenticated-user",
        name: session.user.name ?? "BBK User",
        email: session.user.email ?? "",
        role,
        avatarUrl: session.user.image ?? undefined,
      }
    : null;

  const value: AuthContextType = {
    user,
    role,
    permissions: ROLE_PERMISSIONS[role],
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
