import React, { useState, useEffect, useCallback } from "react";
import { AuthContext, type AuthUser } from "./AuthContext";
import { apiLogin, apiRegister, apiGoogleLogin, apiGetMe } from "../services/authApi";

const TOKEN_KEY = "healthbot_token";
const USER_KEY = "healthbot_user";

const adaptUser = (apiUser: any): AuthUser => ({
  ...apiUser,
  userId: apiUser._id,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      apiGetMe()
        .then((data) => {
            const upUser = adaptUser(data.user);
            setUser(upUser);
            localStorage.setItem(USER_KEY, JSON.stringify(upUser));
            setToken(localStorage.getItem(TOKEN_KEY));
        })
        .catch((err) => {
          console.error("Initial session restore failed:", err);
          // Only clear token if it's definitely an auth error
          if (err.message?.includes("Unauthorized") || err.message?.includes("401") || err.message?.includes("403")) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    const authUser = adaptUser(data.user);
    setUser(authUser);
    setToken(data.token);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await apiRegister(name, email, password);
    const authUser = adaptUser(data.user);
    setUser(authUser);
    setToken(data.token);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
  }, []);

  const googleLogin = useCallback(async (idToken: string) => {
    const data = await apiGoogleLogin(idToken);
    const authUser = adaptUser(data.user);
    setUser(authUser);
    setToken(data.token);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) return;
    try {
      const data = await apiGetMe(); // Assuming no token param needed based on new interceptor logic
      const upUser = adaptUser(data.user);
      setUser(upUser);
      localStorage.setItem(USER_KEY, JSON.stringify(upUser));
    } catch (err) {
      console.error("Failed to refresh user data", err);
    }
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
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
