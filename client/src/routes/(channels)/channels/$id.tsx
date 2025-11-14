import { useChannels } from '@/hooks/useChannels'
import { createFileRoute } from '@tanstack/react-router'
import { Hash } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"

export const Route = createFileRoute('/(channels)/channels/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { channel, channelLoading } = useChannels(id)

  return (
    <div className="flex-1 flex flex-col">
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
            </>
          )
        )}
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {channelLoading ? (
          <div className="py-10 space-y-4 flex flex-col items-center">
            <Skeleton className="h-16 w-16 rounded-md" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-52" />
          </div>
        ) : channel ? (
          <div className="py-8 text-center text-muted-foreground">
            <Hash className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--color-border))]" />
            <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--color-text))]">
              Welcome to #{channel.name}
            </h3>
            <p className="text-sm">This is the beginning of the channel.</p>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>Select a channel to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
