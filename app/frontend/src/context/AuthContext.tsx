import { createContext, useContext, useState, type ReactNode, useEffect } from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setAuth(true);
  }, []);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    setAuth(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setAuth(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}