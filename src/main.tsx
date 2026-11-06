console.log('🟢🟢🟢 ГЛАВНЫЙ ФАЙЛ ЗАПУСТИЛСЯ 🟢🟢');

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

console.log('🟢 ИМПОРТЫ ЗАГРУЖЕНЫ, создаём root...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Элемент #root не найден!');
  }
  
  console.log('🟢 Root найден, рендерим App...');
  
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  
  console.log(' App отрисован успешно!');
} catch (error) {
  console.error(' КРИТИЧЕСКАЯ ОШИБКА ПРИ РЕНДЕРЕ:', error);
  // Показываем ошибку прямо на экране
  document.body.innerHTML = `
    <div style="padding: 20px; background: #fee; color: #900; font-family: monospace;">
      <h2>Ошибка загрузки приложения</h2>
      <pre>${JSON.stringify(error, null, 2)}</pre>
    </div>
  `;
}
