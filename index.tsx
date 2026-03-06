
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
console.log("NÉO App Initialized v2.5.0");
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
