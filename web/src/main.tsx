import './react-globals'
import './design/tokens.css'
import './index.css'

import './design/ios-frame.jsx'
import './design/tweaks-panel.jsx'
import './design/components.jsx'
import './design/screens-pre.jsx'
import './design/screens-app.jsx'
import './design/design-app.jsx'

import React from 'react'
import { createRoot } from 'react-dom/client'
import { useAuth } from './hooks/useAuth'
import * as api from './lib/api'

type DesignAppType = React.ComponentType

function Bridge() {
  const auth = useAuth()

  React.useEffect(() => {
    ;(window as unknown as { __iaAuth: typeof auth }).__iaAuth = auth
    window.dispatchEvent(new CustomEvent('ia-auth-changed'))
  }, [auth])

  React.useEffect(() => {
    ;(window as unknown as { __iaApi: typeof api }).__iaApi = api
  }, [])

  const DesignApp = (window as unknown as { IAChatApp?: DesignAppType }).IAChatApp
  if (!DesignApp) return null
  return <DesignApp />
}

createRoot(document.getElementById('root')!).render(<Bridge />)
