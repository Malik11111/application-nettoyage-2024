import React from 'react';
import ReactDOM from 'react-dom/client';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles/calendar.css';
import './utils/clearStorage'; // Réactivé
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);