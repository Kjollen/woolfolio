import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AuthScreen: React.FC = () => {
  const { login, register, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      const success = await login(email, password);
      if (!success) {
        setError('Неверный email или пароль');
      }
    } else {
      if (!name.trim()) {
        setError('Введите имя');
        return;
      }
      const success = await register(email, password, name);
      if (!success) {
        setError('Пользователь с таким email уже существует');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="WoolFolio" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">WoolFolio</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Учёт вязания</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                isLogin ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Вход
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                !isLogin ? 'bg-emerald-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              Регистрация
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space
