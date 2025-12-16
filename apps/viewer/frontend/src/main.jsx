import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// In development mode, inject mock API if pywebview is not available
if (import.meta.env.DEV && !window.pywebview) {
  const { initializeMockApi } = await import('./mocks/mockPywebviewApi.js')
  initializeMockApi()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
