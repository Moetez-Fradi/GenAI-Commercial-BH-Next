// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: (redirect?: boolean) => void;
  token?: string | null;
  loading: boolean;
  verifyToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type JWTPayload = { exp?: number; [k: string]: any };

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem("token");
    if (!t || t === "undefined") return null;
    return t;
  });

  const [loading, setLoading] = useState(true); // true while verifying on app start

  const isAuthenticated = !!token;

  // local expiry check helper
  const isExpired = (t: string | null) => {
    if (!t) return true;
    try {
      const decoded = jwtDecode<JWTPayload>(t);
      if (!decoded?.exp) return false; // no exp -> can't check locally
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch {
      return false; // token not JWT or decode fail -> conservatively treat as valid for now
    }
  };

  // verify token with server (if you have /auth/me or /userinfo endpoint)
  const verifyToken = async (): Promise<boolean> => {
    if (!token) {
      setLoading(false);
      return false;
    }

    // if token has exp and it's already expired, immediately logout
    if (isExpired(token)) {
      logout(false);
      setLoading(false);
      return false;
    }

    try {
      // Example server verification - adjust URL & logic to your backend
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 200) {
        setLoading(false);
        return true;
      } else {
        logout(false);
        setLoading(false);
        return false;
      }
    } catch (err) {
      // network error: you may or may not want to logout. Here we treat as invalid.
      logout(false);
      setLoading(false);
      return false;
    }
  };

  useEffect(() => {
    // verify token on mount
    verifyToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (newToken: string) => {
    if (!newToken) return;
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = (redirect = true) => {
    localStorage.removeItem("token");
    setToken(null);
    if (redirect) {
      navigate("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token, loading, verifyToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
