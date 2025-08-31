// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  token?: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // initialize based on existing token presence
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem("token");
    if (!t || t === "undefined") return null;
    return t;
  });

  const isAuthenticated = !!token;

  useEffect(() => {
    // optional: here you could verify token validity with backend /userinfo endpoint
  }, []);

  const login = (newToken: string) => {
    if (!newToken) return;
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
