import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './styles/globals.css'
import App from './App.jsx'

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5003'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
