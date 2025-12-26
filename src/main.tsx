import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import { WalletProvider } from './contexts/WalletContext'
import { NetworkProvider } from './contexts/NetworkContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NetworkProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </NetworkProvider>
  </React.StrictMode>
)
