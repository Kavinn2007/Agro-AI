import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Check offline status immediately
if ('serviceWorker' in navigator) {
  registerSW({ immediate: true, onRegisteredSW(swScriptUrl, registration) {
    console.log('SW registered: ', registration);
  }, onRegisterError(error) {
    console.log('SW registration error', error);
  }})
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
