console.log('🟢 MAIN.TSX НАЧАЛ ВЫПОЛНЕНИЕ');

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('🟢 ИМПОРТЫ ЗАГРУЖЕНЫ');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('🟢 APP ОТРИСОВАН');
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
