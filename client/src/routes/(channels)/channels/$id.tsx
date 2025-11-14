
import { useChannels } from '@/hooks/useChannels'
import { createFileRoute } from '@tanstack/react-router'
import { Hash } from 'lucide-react'
import { useEffect } from 'react'
export const Route = createFileRoute('/(channels)/channels/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { channel, fetchChannel } = useChannels()
  useEffect(() => {
    fetchChannel(id)
  }, [id])
  return (
    <div className="flex-1 flex flex-col">
      <div className="h-12 px-4 flex items-center border-b border-border bg-[hsl(var(--color-bg-secondary))]">
        {channel ? (
          <>
            <Hash className="h-5 w-5 text-muted-foreground mr-2" />
            <span className="font-semibold">{channel.name}</span>
          </>
        ) : (
          <span className="font-semibold">Welcome to Auralynk</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-center text-muted-foreground-foreground">
        {channel ? (
          <div className="py-8">
            <Hash className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--color-border))]" />
            <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--color-text))]">
              Welcome to #{channel.name}
            </h3>
            <p className="text-sm">This is the beginning of the channel.</p>
          </div>
        ) : (
          <div className="py-8">
            <p>Select a channel to get started</p>
          </div>
        )}
      </div>
    </div>
  )
}
