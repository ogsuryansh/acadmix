import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Ensure we're in a proper React environment
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

const root = createRoot(rootElement);

// Wrap in error boundary for React 19 compatibility
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
