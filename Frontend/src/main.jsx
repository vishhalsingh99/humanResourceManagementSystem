import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './styles/globals.css'
import App from './App.jsx'
import { API_URL } from './services/api.js'

axios.defaults.baseURL = API_URL

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
