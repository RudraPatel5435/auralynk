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
  onNewMessage?: (message: WSMessage) => void
  onTyping?: (userId: string) => void
  onUserJoined?: (user: { id: string; username: string }) => void
  onUserLeft?: (user: { id: string; username: string }) => void
}

export const useWebSocket = ({
  channelId,
  enabled = true,
  onNewMessage,
  onTyping,
  onUserJoined,
  onUserLeft,
}: UseWebSocketProps) => {
  const [messages, setMessages] = useState<WSMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState<Record<string, boolean>>({})

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const intentionalCloseRef = useRef(false)

  // ✅ Store callbacks in refs to avoid recreating connect function
  const onNewMessageRef = useRef(onNewMessage)
  const onTypingRef = useRef(onTyping)
  const onUserJoinedRef = useRef(onUserJoined)
  const onUserLeftRef = useRef(onUserLeft)

  // ✅ Keep refs up to date
  useEffect(() => {
    onNewMessageRef.current = onNewMessage
    onTypingRef.current = onTyping
    onUserJoinedRef.current = onUserJoined
    onUserLeftRef.current = onUserLeft
  }, [onNewMessage, onTyping, onUserJoined, onUserLeft])

  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

  const cleanupReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  // ✅ Stable connect function - only depends on channelId and enabled
  const connect = useCallback(() => {
    if (!enabled || !channelId) {
      console.log('WebSocket connect skipped: not enabled or no channelId')
      return
    }

    cleanupReconnect()

    // Close previous socket if exists
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      console.log('Closing existing WebSocket before reconnect')
      intentionalCloseRef.current = true
      wsRef.current.close()
      wsRef.current = null
    }

    // ✅ Add small delay to ensure previous connection is fully closed
    setTimeout(() => {
      try {
        console.log(`Connecting to WebSocket: ${WS_URL}/${channelId}`)
        const ws = new WebSocket(`${WS_URL}/${channelId}`)

        ws.onopen = () => {
          console.log('✅ WebSocket connected')
          setIsConnected(true)
          intentionalCloseRef.current = false
        }

        ws.onmessage = (event: MessageEvent) => {
          try {
            const data = JSON.parse(event.data) as WSMessage

            switch (data.type) {
              case 'message':
                setMessages(prev => [...prev, data])
                onNewMessageRef.current?.(data)
                break

              case 'typing':
                if (data.user?.id) {
                  setIsTyping(prev => ({ ...prev, [data.user.id]: true }))
                  onTypingRef.current?.(data.user.id)

                  if (typingTimeoutsRef.current[data.user.id]) {
                    clearTimeout(typingTimeoutsRef.current[data.user.id])
                  }

                  typingTimeoutsRef.current[data.user.id] = setTimeout(() => {
                    setIsTyping(prev => {
                      const copy = { ...prev }
                      delete copy[data.user.id]
                      return copy
                    })
                    delete typingTimeoutsRef.current[data.user.id]
                  }, 3000)
                }
                break

              case 'user_joined':
                onUserJoinedRef.current?.(data.user)
                break

              case 'user_left':
                onUserLeftRef.current?.(data.user)
                break

              case 'error':
                toast.error(data.content ?? 'WebSocket error')
                break

              default:
                console.warn('Unknown WS event type', data)
            }
          } catch (err) {
            console.error('Failed to parse WS message', err)
          }
        }

        ws.onerror = (err) => {
          console.error('❌ WebSocket error:', err)
          // Don't show toast here - wait for onclose to handle it
        }

        ws.onclose = (ev) => {
          console.log(`WebSocket closed: code=${ev.code}, clean=${ev.code === 1000}, intentional=${intentionalCloseRef.current}`)
          setIsConnected(false)

          // ✅ Only reconnect if ALL conditions are met:
          // 1. Not an intentional close
          // 2. Not a clean close (1000)
          // 3. Still enabled
          // 4. No pending reconnect
          if (!intentionalCloseRef.current && ev.code !== 1000 && enabled && !reconnectTimeoutRef.current) {
            console.log('⏳ Scheduling reconnect in 3s...')
            cleanupReconnect()
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('🔄 Attempting reconnect...')
              connect()
            }, 3000)
          } else {
            console.log('No reconnect scheduled')
          }
        }

        wsRef.current = ws
      } catch (err) {
        console.error('❌ Failed to open WebSocket', err)
        toast.error('Failed to connect to chat')
      }
    }, 100) // ✅ Small delay to prevent rapid reconnections
  }, [channelId, enabled, WS_URL, cleanupReconnect])

  // ✅ Single useEffect with stable dependencies
  useEffect(() => {
    console.log(`useWebSocket effect: channelId=${channelId}, enabled=${enabled}`)
    connect()

    return () => {
      console.log('useWebSocket cleanup')
      intentionalCloseRef.current = true
      cleanupReconnect()

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }

      Object.values(typingTimeoutsRef.current).forEach(t => clearTimeout(t))
      typingTimeoutsRef.current = {}
      setMessages([])
      setIsTyping({})
      setIsConnected(false)
    }
  }, [channelId, enabled, connect, cleanupReconnect])

  const disconnect = useCallback(() => {
    intentionalCloseRef.current = true
    cleanupReconnect()
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [cleanupReconnect])

  const sendMessage = useCallback((content: string) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'message', content }))
    } else {
      console.warn('Cannot send message: WebSocket not open')
      toast.error('Not connected to chat')
    }
  }, [])

  const sendTyping = useCallback(() => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'typing' }))
    }
  }, [])

  return {
    messages,
    isConnected,
    isTyping,
    sendMessage,
    sendTyping,
    disconnect,
  }
}
