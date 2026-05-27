import { useEffect, useRef } from 'react'
import type { TelegramUser } from '../types'

interface TelegramLoginButtonProps {
  botName: string
  onAuth: (user: TelegramUser) => void
  buttonSize?: 'large' | 'medium' | 'small'
  cornerRadius?: number
  requestAccess?: boolean
}

declare global {
  interface Window {
    TelegramLoginCallback?: (user: TelegramUser) => void
  }
}

export function TelegramLoginButton({
  botName,
  onAuth,
  buttonSize = 'large',
  cornerRadius = 12,
  requestAccess = true,
}: TelegramLoginButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set global callback
    window.TelegramLoginCallback = onAuth

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botName)
    script.setAttribute('data-size', buttonSize)
    script.setAttribute('data-radius', String(cornerRadius))
    script.setAttribute('data-onauth', 'TelegramLoginCallback(user)')
    if (requestAccess) script.setAttribute('data-request-access', 'write')
    script.async = true

    containerRef.current?.appendChild(script)

    return () => {
      containerRef.current?.removeChild(script)
      delete window.TelegramLoginCallback
    }
  }, [botName, buttonSize, cornerRadius, requestAccess, onAuth])

  return <div ref={containerRef} />
}
