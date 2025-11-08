import React, { createContext, useContext, useState, type ReactNode } from 'react';
// 1. REMOVED useNavigate from here

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dattu-auth') === 'true';
  });
  
  // 2. REMOVED const navigate = useNavigate();

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('dattu-auth', 'true');
  };

  const logout = () => {
    // 3. SIMPLIFIED: Just update state and localStorage.
    // The component calling logout() will handle the redirect.
    setIsAuthenticated(false);
    localStorage.removeItem('dattu-auth');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};