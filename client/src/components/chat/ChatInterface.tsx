import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWebSocket } from '@/hooks/useWebSocket'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { useCurrentUser } from '@/hooks/useAuth'

interface ChatInterfaceProps {
  channelId: string
  channelName: string
}

interface HistoricalMessage {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    username: string
  }
}

interface UnifiedMessage {
  id: string
  content: string
  timestamp: string
  user: {
    id: string
    username: string
  }
}

export const ChatInterface = ({ channelId, channelName }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('')
  const [historicalMessages, setHistoricalMessages] = useState<HistoricalMessage[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: currentUser } = useCurrentUser()
  const {
    messages: wsMessages,
    isConnected,
    isTyping,
    sendMessage,
    sendTyping,
  } = useWebSocket({
    channelId,
    enabled: true,
  })

  // Load message history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoadingHistory(true)
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

        const res = await fetch(
          `${API_URL}/channels/${channelId}/messages?limit=50`,
          { credentials: 'include' },
        )

        if (res.ok) {
          const json = await res.json()
          const items: HistoricalMessage[] = json.data?.messages ?? []
          setHistoricalMessages(items.reverse())
        }
      } catch (err) {
        console.error('Failed to fetch message history:', err)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    fetchHistory()
  }, [channelId])

  // Merge historical + websocket messages
  const allMessages = useMemo<UnifiedMessage[]>(() => {
    const map = new Map<string, UnifiedMessage>()

    // Add history
    for (const m of historicalMessages) {
      map.set(m.id, {
        id: m.id,
        content: m.content,
        timestamp: m.created_at,
        user: m.user,
      })
    }

    // Add ws messages
    for (const m of wsMessages) {
      if (m.type !== 'message') continue

      const id = m.message_id || crypto.randomUUID()

      if (!map.has(id)) {
        map.set(id, {
          id,
          content: m.content || '',
          timestamp: m.timestamp,
          user: m.user,
        })
      }
    }

    return [...map.values()]
  }, [historicalMessages, wsMessages])

  // Scroll to bottom on new messages
  useEffect(() => {
    const container = scrollRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [allMessages.length, isLoadingHistory])

  // Form handlers
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !isConnected) return

    sendMessage(inputValue.trim())
    setInputValue('')
    inputRef.current?.focus()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    sendTyping()
  }

  // Typing indicators
  const otherTypingUsers = Object.keys(isTyping).filter(id => id !== currentUser?.id)

  return (
    <div className="flex-1 flex flex-col h-full">

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div ref={scrollRef}>
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <p className="text-lg font-semibold">No messages yet</p>
              <p className="text-sm mt-1">
                Be the first to send a message in #{channelName}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {allMessages.map(msg => (
                <ChatMessage
                  key={msg.id}
                  id={msg.id}
                  content={msg.content}
                  username={msg.user.username}
                  userId={msg.user.id}
                  timestamp={msg.timestamp}
                  isCurrentUser={msg.user.id === currentUser?.id}
                />
              ))}
            </div>
          )}

          {otherTypingUsers.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
              <div className="flex gap-1">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>●</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>●</span>
              </div>
              <span>Someone is typing...</span>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input section */}
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={`Message #${channelName}`}
            disabled={!isConnected}
            maxLength={2000}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || !isConnected}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {!isConnected && (
          <p className="text-xs text-primary mt-2 ml-3">
            Connecting to chat...
          </p>
        )}
      </div>
    </div>
  )
}
