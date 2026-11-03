import React, { createContext, useContext, useState, useEffect } from 'react';
import pb from '../lib/pocketbase';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: checking auth state');
    if (pb.authStore.isValid) {
      const authUser = pb.authStore.model;
      console.log('AuthProvider: user found', authUser);
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.name || authUser.email,
          createdAt: authUser.created,
        });
      }
    } else {
      console.log('AuthProvider: no valid auth');
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    console.log('Login attempt:', email);
    setIsLoading(true);
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      console.log('Login success:', authData.record);
      const authUser = authData.record;
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name || authUser.email,
        createdAt: authUser.created,
      });
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    console.log('Register attempt:', { email, name });
    setIsLoading(true);
    try {
      const data = {
        email,
        password,
        passwordConfirm: password,
        name,
      };
      console.log('Creating user with data:', data);
      const createdUser = await pb.collection('users').create(data);
      console.log('User created:', createdUser);
      
      console.log('Attempting auto-login...');
      const authData = await pb.collection('users').authWithPassword(email, password);
      console.log('Auto-login success:', authData.record);
      const authUser = authData.record;
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name || authUser.email,
        createdAt: authUser.created,
      });
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error('Register error:', error);
      console.error('Error details:', error.response || error.message);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    console.log('Logout');
    pb.authStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
