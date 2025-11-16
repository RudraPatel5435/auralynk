import React, { useEffect, useRef, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useWebSocket, WSMessage } from '@/hooks/useWebSocket'
import { useMessages } from '@/hooks/useMessages'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { useCurrentUser } from '@/hooks/useAuth'

interface ChatInterfaceProps {
  channelId: string
  channelName: string
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ channelId, channelName }) => {
  const [inputValue, setInputValue] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { data: currentUser } = useCurrentUser()

  const { messages, isLoading, addMessageFromWS } = useMessages(channelId)

  const {
    isConnected,
    isTyping,
    sendMessage,
    sendTyping,
  } = useWebSocket({
    channelId,
    enabled: true,
    onNewMessage: (m: WSMessage) => {
      if (m.type === 'message' && m.message_id) {
        addMessageFromWS({
          message_id: m.message_id,
          content: m.content,
          timestamp: m.timestamp,
          user: m.user,
        })
      } else {
        console.warn('Received WS message without DB id (message_id)', m)
      }
    },
  })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const t = setTimeout(() => {
      el.scrollTop = el.scrollHeight
    }, 50)
    return () => clearTimeout(t)
  }, [messages.length, isLoading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || !isConnected) return
    sendMessage(trimmed)
    setInputValue('')
    inputRef.current?.focus()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    sendTyping()
  }

  const otherTypingUsers = Object.keys(isTyping).filter(id => id !== currentUser?.id)

  return (
    <div className="flex-1 flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div ref={scrollRef}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <p className="text-lg font-semibold">No messages yet</p>
              <p className="text-sm mt-1">Be the first to send a message in #{channelName}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  id={m.id}
                  content={m.content}
                  username={m.user.username}
                  userId={m.user.id}
                  timestamp={m.created_at}
                  isCurrentUser={m.user.id === currentUser?.id}
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

      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleChange}
            placeholder={`Message #${channelName}`}
            disabled={!isConnected}
            maxLength={2000}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim() || !isConnected}>
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
