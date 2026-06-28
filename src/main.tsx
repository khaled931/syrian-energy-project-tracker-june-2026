import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import './styles/map.css';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import MobileDensityToggle from './components/MobileDensityToggle';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <MobileDensityToggle />
    </ErrorBoundary>
  </React.StrictMode>
);
