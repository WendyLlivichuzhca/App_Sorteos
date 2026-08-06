import { createContext, useContext, useState } from "react";
import { login as loginApi, getToken, setToken, clearToken } from "../services/api.js";

const AuthContext = createContext(null);

const ADMIN_KEY = "sorteos_admin_user";

const loadAdmin = () => {
  try {
    const raw = localStorage.getItem(ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(loadAdmin);
  const [token, setTokenState] = useState(getToken);

  const login = async (usuario, password) => {
    const data = await loginApi(usuario, password);
    setToken(data.token);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(data.admin));
    setTokenState(data.token);
    setAdmin(data.admin);
    return data.admin;
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem(ADMIN_KEY);
    setTokenState(null);
    setAdmin(null);
  };

  const value = {
    admin,
    token,
    isAuthenticated: Boolean(token),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
};
