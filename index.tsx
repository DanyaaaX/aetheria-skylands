import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { TonConnectProviderWithReset } from './components/TonConnectProviderWithReset';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TonConnectProviderWithReset>
      <HashRouter>
        <App />
      </HashRouter>
    </TonConnectProviderWithReset>
  </React.StrictMode>
);