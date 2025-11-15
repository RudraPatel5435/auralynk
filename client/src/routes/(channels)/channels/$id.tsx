import { useChannels } from '@/hooks/useChannels'
import { createFileRoute } from '@tanstack/react-router'
import { Hash } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { ChatInterface } from '@/components/chat/ChatInterface'

export const Route = createFileRoute('/(channels)/channels/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { channel, channelLoading } = useChannels(id)

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="h-12 px-4 flex items-center border-b border-border bg-secondary">
        {channelLoading ? (
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5 rounded-md" />
            <Skeleton className="h-4 w-32" />
          </div>
        ) : (
          channel && (
            <>
              <Hash className="h-5 w-5 text-muted-foreground mr-2" />
              <span className="font-semibold">{channel.name}</span>
              <span className="mx-3 text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {channel.member_count} {channel.member_count === 1 ? 'member' : 'members'}
              </span>
            </>
          )
        )}
      </div>

      {/* Chat Interface */}
      {channelLoading ? (
        <div className="flex-1 p-4 space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : channel ? (
        <ChatInterface channelId={channel.id} channelName={channel.name} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>Channel not found</p>
        </div>
      )}
    </div>
  )
}
