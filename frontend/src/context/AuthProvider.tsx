import React, { useState, useEffect, useCallback } from "react";
import { AuthContext, type AuthUser } from "./AuthContext";
import { apiLogin, apiRegister, apiGoogleLogin, apiGetMe } from "../services/authApi";

const TOKEN_KEY = "healthbot_token";

const adaptUser = (apiUser: any): AuthUser => ({
  ...apiUser,
  userId: apiUser._id,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      apiGetMe(savedToken)
        .then((data) => {
          setUser(adaptUser(data.user));
          setToken(savedToken);
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setUser(adaptUser(data.user));
    setToken(data.token);
    localStorage.setItem(TOKEN_KEY, data.token);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await apiRegister(name, email, password);
    setUser(adaptUser(data.user));
    setToken(data.token);
    localStorage.setItem(TOKEN_KEY, data.token);
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const data = await apiGoogleLogin(idToken);
    setUser(adaptUser(data.user));
    setToken(data.token);
    localStorage.setItem(TOKEN_KEY, data.token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
