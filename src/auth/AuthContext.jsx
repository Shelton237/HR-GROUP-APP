import { createContext, useCallback, useEffect, useState } from "react";
import * as authApi from "../api/auth";
import { getToken, setToken as persistToken } from "../api/client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);
  // "loading" while we still need to resolve whether the stored token is valid.
  const [status, setStatus] = useState(token ? "loading" : "ready");

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setUser(null);
      setStatus("ready");
      return;
    }
    setStatus("loading");
    (async () => {
      try {
        const res = await authApi.me();
        if (!cancelled) {
          setUser(res?.user || res);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) {
          persistToken(null);
          setTokenState(null);
          setUser(null);
          setStatus("ready");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    if (res?.token) {
      persistToken(res.token);
      setTokenState(res.token);
    }
    if (res?.user) setUser(res.user);
    return res; // caller inspects res.mustChangePassword / res.must_change_password
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    setTokenState(null);
    setUser(null);
  }, []);

  const value = {
    token,
    user,
    isAuthenticated: !!token && !!user,
    isLoading: status === "loading",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
