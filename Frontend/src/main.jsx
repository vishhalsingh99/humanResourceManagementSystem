import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './styles/globals.css'
import App from './App.jsx'
import { BACKEND_URL } from './services/api.js'

axios.defaults.baseURL = BACKEND_URL

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
