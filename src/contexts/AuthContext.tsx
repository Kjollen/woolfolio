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

  // Функция восстановления сессии из cookie/localStorage
  const restoreAuth = () => {
    // Восстанавливаем токен из cookie (PocketBase хранит его там)
    pb.authStore.loadFromCookie(document.cookie);
    
    // Также пробуем из localStorage (на случай если cookie не сработали)
    const savedToken = localStorage.getItem('pb_auth');
    if (savedToken) {
      try {
        const authData = JSON.parse(savedToken);
        pb.authStore.save(authData.token, authData.model);
      } catch (e) {
        console.error('Ошибка восстановления из localStorage:', e);
      }
    }

    if (pb.authStore.isValid) {
      const authUser = pb.authStore.model;
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          name: authUser.name || authUser.email,
          createdAt: authUser.created,
        });
        console.log('✅ Сессия восстановлена:', authUser.email);
      }
    } else {
      console.log('⚠️ Сессия не найдена, пользователь не авторизован');
    }
  };

  useEffect(() => {
    // Восстановление сессии при загрузке страницы
    restoreAuth();
    setIsLoading(false);
  }, []);

  // Сохраняем токен при каждом изменении authStore
  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.model) {
      // Сохраняем в cookie
      pb.authStore.bindAuthCookie(document.cookie);
      
      // Сохраняем в localStorage
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
