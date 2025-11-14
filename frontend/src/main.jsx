import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Asegúrate de que la ruta sea correcta
import './App.css'; // O tu archivo CSS principal

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* Aquí se renderiza tu componente principal */}
  </React.StrictMode>,
);