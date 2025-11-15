import { formatDistanceToNow } from 'date-fns'

interface ChatMessageProps {
  id: string
  content: string
  username: string
  userId: string
  timestamp: string
  isCurrentUser?: boolean
}

export const ChatMessage = ({
  content,
  username,
  timestamp,
  isCurrentUser = false,
}: ChatMessageProps) => {
  const timeAgo = formatDistanceToNow(new Date(timestamp), { addSuffix: true })

  return (
    <div className={`flex gap-3 p-2 hover:bg-accent/50 rounded group ${isCurrentUser ? 'bg-primary/5' : ''
      }`}>
      <div className="shrink-0">
        <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
          {username[0].toUpperCase()}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-sm">
            {username}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                (you)
              </span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>

        <p className="text-sm mt-1 wrap-break-words whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  )
}
