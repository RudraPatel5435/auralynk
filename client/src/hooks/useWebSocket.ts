import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface WSUser {
  id: string
  username: string
}

export interface WSMessage {
  type: 'message' | 'typing' | 'user_joined' | 'user_left' | 'error'
  content?: string
  message_id?: string
  user: WSUser
  timestamp: string
}

interface UseWebSocketProps {
  channelId: string
  enabled?: boolean
}

export const useWebSocket = ({ channelId, enabled = true }: UseWebSocketProps) => {
  const [messages, setMessages] = useState<WSMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({})

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isConnectedRef = useRef(false)
  const intentionalCloseRef = useRef(false)

  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

  const cleanupReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  const connect = useCallback(() => {
    if (!enabled || !channelId) return

    cleanupReconnect()

    // Close previous WS if needed
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      intentionalCloseRef.current = true
      wsRef.current.close()
    }

    const ws = new WebSocket(`${WS_URL}/${channelId}`)

    ws.onopen = () => {
      setIsConnected(true)
      isConnectedRef.current = true
      intentionalCloseRef.current = false
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const data: WSMessage = JSON.parse(event.data)

        switch (data.type) {
          case 'message':
            setMessages(prev => [...prev, data])
            break

          case 'typing':
            setIsTyping(prev => ({ ...prev, [data.user.id]: true }))
            setTimeout(() => {
              setIsTyping(prev => {
                const updated = { ...prev }
                delete updated[data.user.id]
                return updated
              })
            }, 3000)
            break

          case 'user_joined':
            console.log(`${data.user.username} joined`)
            break

          case 'user_left':
            console.log(`${data.user.username} left`)
            break

          case 'error':
            toast.error(data.content ?? 'An unknown WebSocket error occurred')
            break
        }
      } catch (err) {
        console.error('Invalid WS message:', err)
      }
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }

    ws.onclose = (event) => {
      setIsConnected(false)
      isConnectedRef.current = false

      if (!intentionalCloseRef.current && event.code !== 1000 && enabled) {
        reconnectTimeoutRef.current = setTimeout(() => connect(), 3000)
      }
    }

    wsRef.current = ws
  }, [WS_URL, channelId, enabled])

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true

    cleanupReconnect()

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const sendMessage = useCallback((content: string) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'message', content }))
    } else {
      toast.error('Not connected to chat')
    }
  }, [])

  const sendTyping = useCallback(() => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {

      // Debounce typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      ws.send(JSON.stringify({ type: 'typing' }))

      typingTimeoutRef.current = setTimeout(() => { }, 1000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      disconnect()
      setMessages([])
    }
  }, [connect, disconnect])

  return {
    messages,
    isConnected,
    isTyping,
    sendMessage,
    sendTyping,
  }
}
