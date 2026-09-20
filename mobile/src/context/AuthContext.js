import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { clearToken, getToken, loginWithProvider, saveToken } from "../services/auth";
import { getMe } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null); // /api/me 응답 (닉네임, 레벨, XP 등)
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const data = await getMe();
    setMe(data);
    return data;
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (token) {
        try {
          await refreshMe();
        } catch {
          await clearToken();
        }
      }
      setIsLoading(false);
    })();
  }, [refreshMe]);

  const login = useCallback(
    async (provider) => {
      const { token } = await loginWithProvider(provider);
      await saveToken(token);
      await refreshMe();
    },
    [refreshMe]
  );

  const logout = useCallback(async () => {
    await clearToken();
    setMe(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ me, isLoading, isAuthenticated: !!me, login, logout, refreshMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
