import React from 'react'
import ReactDOM from 'react-dom/client'
import AppProvider from './app/providers/router-provider'
import './style.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProvider />
  </React.StrictMode>,
)
