import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import posthog from 'posthog-js'
import { MemoriesAuthProvider } from './lib/auth.jsx'
import App from './App.jsx'

posthog.init('phc_Hh489hJe61eRVjGqFwz8DfzbY2Rla4yXn7PXONt6yQX', {
  api_host: 'https://us.i.posthog.com',
  person_profiles: 'identified_only',
  capture_pageview: true,
  capture_pageleave: true,
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MemoriesAuthProvider>
        <App />
      </MemoriesAuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
