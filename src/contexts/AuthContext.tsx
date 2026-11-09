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
  console.log('🔍 Начинаем восстановление сессии...');
  console.log('🔍 document.cookie:', document.cookie);
  console.log('🔍 localStorage pb_auth:', localStorage.getItem('pb_auth'));
  
  // 1. Пробуем восстановить из cookie (может не сработать в Safari)
  try {
    pb.authStore.loadFromCookie(document.cookie);
    console.log('🔍 После loadFromCookie isValid:', pb.authStore.isValid);
  } catch (e) {
    console.error('🔍 Ошибка loadFromCookie:', e);
  }
  
  // 2. Пробуем восстановить из localStorage (надёжнее в Safari)
  const savedToken = localStorage.getItem('pb_auth');
  if (savedToken) {
    try {
      const authData = JSON.parse(savedToken);
      if (authData.token && authData.model) {
        pb.authStore.save(authData.token, authData.model);
        console.log('🔍 Токен восстановлен из localStorage');
      }
    } catch (e) {
      console.error('🔍 Ошибка парсинга localStorage:', e);
    }
  }

  console.log('🔍 Финальный isValid:', pb.authStore.isValid);
  console.log('🔍 Финальный model:', pb.authStore.model);

  if (pb.authStore.isValid && pb.authStore.model) {
    const authUser = pb.authStore.model;
    setUser({
      id: authUser.id,
      email: authUser.email,
      name: authUser.name || authUser.email,
      createdAt: authUser.created,
    });
    console.log('✅ Сессия восстановлена:', authUser.email);
  } else {
    console.log('⚠️ Сессия НЕ восстановлена, user будет null');
  }
  
  setIsLoading(false);
}, []);

  // Сохраняем токен при изменении user
  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.model) {
      localStorage.setItem('pb_auth', JSON.stringify({
        token: pb.authStore.token,
        model: pb.authStore.model,
      }));
    } else {
      localStorage.removeItem('pb_auth');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
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
    setIsLoading(true);
    try {
      const data = {
        email,
        password,
        passwordConfirm: password,
        name,
      };
      await pb.collection('users').create(data);
      const authData = await pb.collection('users').authWithPassword(email, password);
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
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    pb.authStore.clear();
    localStorage.removeItem('pb_auth');
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
