import React, { createContext, useContext, useState } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  authenticate: () => void;
  lockApp: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  authenticate: () => { },
  lockApp: () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const authenticate = () => setIsAuthenticated(true);
  const lockApp = () => setIsAuthenticated(false);

  return (
    <AuthContext.Provider value={{ isAuthenticated, authenticate, lockApp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
