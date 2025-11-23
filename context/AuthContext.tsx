import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { base44 } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, name: string, photoUrl: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, name: string, photoUrl: string) => {
    setLoading(true);
    try {
      const user = await base44.auth.loginWithGoogle(email, name, photoUrl);
      setUser(user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await base44.auth.logout();
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    if (!user) return;
    const updated = await base44.entities.User.update(user.id, data);
    setUser(updated);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
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