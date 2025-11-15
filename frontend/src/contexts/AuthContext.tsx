import React, { createContext, useContext, useState, type ReactNode } from 'react';

// This User interface must match all roles
export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "user" | "CEO" | "CFO" | "CHRO" | "COO" | "SafetyManager";
  company_name?: string;
  subscription_tier: string;
  status: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void; 
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('dattu-user');
    try {
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error("Failed to parse stored user:", e);
      return null;
    }
  });
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('dattu-token');
  });

  const isAuthenticated = !!token && !!user;

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('dattu-user', JSON.stringify(user));
    localStorage.setItem('dattu-token', token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('dattu-user');
    localStorage.removeItem('dattu-token');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, login, logout }}>
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