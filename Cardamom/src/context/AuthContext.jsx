import { createContext, useMemo, useState } from "react";

export const AuthContext = createContext(null);

const ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

const parseJwt = (token) => {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
};

const isTokenExpired = (payload) => {
  if (!payload?.exp) return false;
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
};

const extractRole = (payload) => {
  if (!payload) return null;
  return payload.role ?? payload[ROLE_CLAIM] ?? null;
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const storedToken = localStorage.getItem("token");
    const parsed = parseJwt(storedToken);
    if (!storedToken || !parsed || isTokenExpired(parsed)) {
      localStorage.removeItem("token");
      return null;
    }
    return storedToken;
  });
  const [user, setUser] = useState(() => {
    const storedToken = localStorage.getItem("token");
    const parsed = parseJwt(storedToken);
    if (!storedToken || !parsed || isTokenExpired(parsed)) {
      localStorage.removeItem("token");
      return null;
    }
    return parsed;
  });
  const [role, setRole] = useState(
    () => {
      const storedToken = localStorage.getItem("token");
      const parsed = parseJwt(storedToken);
      if (!storedToken || !parsed || isTokenExpired(parsed)) {
        localStorage.removeItem("role");
        return null;
      }
      return localStorage.getItem("role") ?? extractRole(parsed);
    },
  );

  const login = (jwt, userRole) => {
    const parsed = parseJwt(jwt);
    if (!parsed || isTokenExpired(parsed)) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      setToken(null);
      setUser(null);
      setRole(null);
      return;
    }

    localStorage.setItem("token", jwt);
    const resolvedRole = userRole ?? extractRole(parsed);
    if (resolvedRole) {
      localStorage.setItem("role", resolvedRole);
      setRole(resolvedRole);
    } else {
      localStorage.removeItem("role");
      setRole(null);
    }
    setToken(jwt);
    setUser(parsed);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setUser(null);
    setRole(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      role,
      login,
      logout,
      isAuthenticated: Boolean(token && user && !isTokenExpired(user)),
    }),
    [token, user, role],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
