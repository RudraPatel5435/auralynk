import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface WSMessage {
  type: 'message' | 'typing' | 'user_joined' | 'user_left' | 'error'
  content?: string
  message_id?: string
  user: {
    id: string
    username: string
  }
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    if (!enabled || !channelId) return

    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

    try {
      const ws = new WebSocket(`${WS_URL}/${channelId}`)

      ws.onopen = () => {
        console.log('WebSocket connected')
        setIsConnected(true)
        toast.success('Connected to chat')
      }

      ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data)

          if (data.type === 'message') {
            setMessages((prev) => [...prev, data])
          } else if (data.type === 'typing') {
            setIsTyping((prev) => ({ ...prev, [data.user.id]: true }))

            setTimeout(() => {
              setIsTyping((prev) => {
                const updated = { ...prev }
                delete updated[data.user.id]
                return updated
              })
            }, 3000)
          } else if (data.type === 'user_joined') {
            toast.info(`${data.user.username} joined the channel`)
          } else if (data.type === 'user_left') {
            toast.info(`${data.user.username} left the channel`)
          } else if (data.type === 'error') {
            toast.error(data.content || 'An error occurred')
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast.error('Connection error')
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setIsConnected(false)

        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, 3000)
      }

      wsRef.current = ws
    } catch (err) {
      console.error('Failed to connect WebSocket:', err)
      toast.error('Failed to connect to chat')
    }
  }, [channelId, enabled])

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
  }, [])

  const sendMessage = useCallback((content: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'message',
          content,
        })
      )
    } else {
      toast.error('Not connected to chat')
    }
  }, [])

  const sendTyping = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
        })
      )

      // Debounce typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        // Could send "stopped typing" if needed
      }, 1000)
    }
  }, [])

  useEffect(() => {
    connect()

    return () => {
      disconnect()
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
