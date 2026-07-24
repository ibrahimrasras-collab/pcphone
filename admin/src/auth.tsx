import { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "./api";

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  extension: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    if (stored && localStorage.getItem("admin_token")) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (res.user.role !== "admin") {
      throw new Error("Access denied — admin role required");
    }
    localStorage.setItem("admin_token", res.tokens.accessToken);
    localStorage.setItem("admin_user", JSON.stringify(res.user));
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
