import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

function getTokenExpiry(token) {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1]),
    );

    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const savedAuth = localStorage.getItem("authData");

    if (!savedAuth) {
      return null;
    }

    try {
      return JSON.parse(savedAuth);
    } catch {
      localStorage.removeItem("authData");
      return null;
    }
  });

  function clearSession() {
    setAuth(null);

    localStorage.removeItem("authData");
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }

  function login(authData) {
    setAuth(authData);

    localStorage.setItem(
      "authData",
      JSON.stringify(authData),
    );
  }

  function logout() {
    clearSession();
  }

  useEffect(() => {
    function handleExpiredSession() {
      clearSession();

      if (window.location.pathname !== "/login") {
        window.location.replace(
          "/login?session=expired",
        );
      }
    }

    window.addEventListener(
      "auth:expired",
      handleExpiredSession,
    );

    return () => {
      window.removeEventListener(
        "auth:expired",
        handleExpiredSession,
      );
    };
  }, []);

  useEffect(() => {
    const accessToken = auth?.accessToken;

    if (!accessToken) {
      return undefined;
    }

    const expiresAt = getTokenExpiry(accessToken);

    if (!expiresAt) {
      return undefined;
    }

    const remainingTime = expiresAt - Date.now();

    if (remainingTime <= 0) {
      window.dispatchEvent(
        new CustomEvent("auth:expired"),
      );

      return undefined;
    }

    const timeout = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("auth:expired"),
      );
    }, remainingTime);

    return () => clearTimeout(timeout);
  }, [auth?.accessToken]);

  const value = {
    user: auth?.user || null,

    accessToken: auth?.accessToken || null,

    refreshToken: auth?.refreshToken || null,

    isAuthenticated: Boolean(auth?.accessToken),

    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}