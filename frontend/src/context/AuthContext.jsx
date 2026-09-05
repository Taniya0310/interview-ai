import {
  createContext,
  useContext,
  useState
} from "react";

const AuthContext =
  createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const savedAuth =
      localStorage.getItem("authData");

    return savedAuth
      ? JSON.parse(savedAuth)
      : null;
  });

  function login(authData) {
    setAuth(authData);

    localStorage.setItem(
      "authData",
      JSON.stringify(authData)
    );
  }

  function logout() {
    setAuth(null);
    localStorage.removeItem("authData");
  }

  const value = {
    user: auth?.user || null,

    accessToken:
      auth?.accessToken || null,

    refreshToken:
      auth?.refreshToken || null,

    isAuthenticated:
      Boolean(auth?.accessToken),

    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}