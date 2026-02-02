import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './App.css'

// Set body background
document.body.style.margin = '0'
document.body.style.padding = '0'
document.body.style.backgroundColor = '#aafa82'
document.body.style.minHeight = '100vh'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
