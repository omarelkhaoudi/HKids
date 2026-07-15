import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { registerServiceWorker } from './services/offline/registerServiceWorker';
import { initCapacitorRuntime } from './services/mobile/capacitorRuntime';
import { initSentry } from './lib/sentry';

initSentry();
window.addEventListener('hkids:consent-changed', () => initSentry());
registerServiceWorker();
initCapacitorRuntime();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

