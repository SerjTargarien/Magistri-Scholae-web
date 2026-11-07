import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import './index.css';

// Register service worker for PWA offline features
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Magistri Scholae Service Worker registered successfully:', reg.scope);
      })
      .catch(err => {
        console.warn('Service Worker registration failed:', err);
      });
  });
}

async function mount() {
  const mode = import.meta.env.VITE_STORAGE_MODE;
  const { default: App } = mode === 'remote' ? await import('./remote/RemoteApp') : await import('./App');
  createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
}
void mount();
