import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(
  document.getElementById('root')
).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        console.log('PWA service worker registered');
      })
      .catch((error) => {
        console.error(
          'Service worker registration failed:',
          error
        );
      });
  });
}