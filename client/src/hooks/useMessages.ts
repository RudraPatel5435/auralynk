import { useQuery, useQueryClient } from '@tanstack/react-query'

export interface Message {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    username: string
  }
}

interface MessagesResponse {
  data: {
    messages: Message[]
  }
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

// Fetch last N messages for a channel (newest last)
const fetchMessages = async (channelId: string): Promise<Message[]> => {
  const res = await fetch(
    `${API_URL}/channels/${channelId}/messages?limit=50`,
    { credentials: 'include' }
  )

  if (!res.ok) {
    throw new Error(`Failed to fetch messages for channel ${channelId}`)
  }

  const json: MessagesResponse = await res.json()
  return [...json.data.messages].reverse()
}

export const useMessages = (channelId: string) => {
  const queryClient = useQueryClient()

  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Message[], Error>({
    queryKey: ['messages', channelId],
    queryFn: () => fetchMessages(channelId),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    enabled: Boolean(channelId),
  })

  const addMessage = (message: Message) => {
    queryClient.setQueryData<Message[]>(
      ['messages', channelId],
      (old = []) => {
        if (old.some(m => m.id === message.id)) return old
        return [...old, message]
      }
    )
  }

  const addMessageFromWS = (wsPayload: {
    message_id: string
    content?: string
    timestamp: string
    user: { id: string; username: string }
  }) => {
    const msg: Message = {
      id: wsPayload.message_id,
      content: wsPayload.content ?? '',
      created_at: wsPayload.timestamp,
      user: wsPayload.user,
    }

    addMessage(msg)
  }

  const addMessages = (incoming: Message[]) => {
    queryClient.setQueryData<Message[]>(
      ['messages', channelId],
      (old = []) => {
        const existing = new Set(old.map(m => m.id))
        const filtered = incoming.filter(m => !existing.has(m.id))
        if (filtered.length === 0) return old
        return [...old, ...filtered]
      }
    )
  }

  const invalidateMessages = () => {
    queryClient.invalidateQueries({ queryKey: ['messages', channelId] })
  }

  return {
    messages,
    isLoading,
    error,
    refetch,
    addMessage,
    addMessages,
    addMessageFromWS,
    invalidateMessages,
  }
}
