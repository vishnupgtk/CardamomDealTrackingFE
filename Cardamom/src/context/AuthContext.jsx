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

const extractRole = (payload) => {
  if (!payload) return null;
  return payload.role ?? payload[ROLE_CLAIM] ?? null;
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(() =>
    parseJwt(localStorage.getItem("token")),
  );
  const [role, setRole] = useState(
    () => localStorage.getItem("role") ?? extractRole(parseJwt(localStorage.getItem("token"))),
  );

  const login = (jwt, userRole) => {
    localStorage.setItem("token", jwt);
    const parsed = parseJwt(jwt);
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
      isAuthenticated: Boolean(token),
    }),
    [token, user, role],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
