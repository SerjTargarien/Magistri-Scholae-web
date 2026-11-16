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
  // Demo builds only: the account app talks to the in-browser mock server.
  // The condition is replaced at build time, so other builds contain no mock code.
  if (import.meta.env.VITE_MOCK_SERVER === "true") (await import('./mock/server')).installMockServer();
  // The players' view (7a): its own page, with no account and no sign-in.
  if (window.location.pathname === "/vista") {
    const { ViewerPage } = await import('./vista/ViewerPage');
    createRoot(document.getElementById('root')!).render(<StrictMode><ViewerPage /></StrictMode>);
    return;
  }
  const { default: App } = await import('./App');
  createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
}
void mount();
