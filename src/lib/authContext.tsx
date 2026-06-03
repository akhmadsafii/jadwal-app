"use client";

import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from "react";

type Role = "ADMIN" | "EMPLOYEE";

interface User {
  id: string;
  nip: string;
  name: string;
  role: Role;
  position?: string;
  avatarUrl?: string;
  email?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isDefaultPassword: boolean;
  login: (nip: string, password: string, isAdmin: boolean) => Promise<{ success: boolean; error?: string; isDefaultPassword?: boolean }>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDefaultPassword, setIsDefaultPassword] = useState(false);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedIsDefault = localStorage.getItem("isDefaultPassword");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsDefaultPassword(storedIsDefault === "true");
    }
    setIsLoading(false);
  }, []);

  const login = async (nip: string, password: string, isAdmin: boolean) => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nip, password, isAdmin }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      setToken(data.token);
      setUser(data.user);
      setIsDefaultPassword(data.isDefaultPassword);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("isDefaultPassword", String(data.isDefaultPassword));

      return { success: true, isDefaultPassword: data.isDefaultPassword };
    } catch {
      return { success: false, error: "Terjadi kesalahan koneksi" };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
      setToken(null);
      setIsDefaultPassword(false);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("isDefaultPassword");
    }
  };

  const updateUser = useCallback((nextUser: User) => {
    setUser(nextUser);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }, []);

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!token || !user) return { success: false, error: "Tidak ada sesi aktif" };

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: user.id,
          currentPassword,
          newPassword,
          confirmPassword: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error };
      }

      setIsDefaultPassword(false);
      localStorage.setItem("isDefaultPassword", "false");

      return { success: true };
    } catch {
      return { success: false, error: "Terjadi kesalahan koneksi" };
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isDefaultPassword, login, logout, changePassword, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
