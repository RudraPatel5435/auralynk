import { useChannels } from '@/hooks/useChannels'
import { createFileRoute } from '@tanstack/react-router'
import { Hash, Users, X } from 'lucide-react'
import { Skeleton } from "@/components/ui/skeleton"
import { ChatInterface } from '@/components/chat/ChatInterface'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export const Route = createFileRoute('/(channels)/channels/$id')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  const { channel, channelLoading } = useChannels(id)
  const [showMembers, setShowMembers] = useState(false)
  console.log(channel)

  const members = channel?.members ?? []

  return (
    <div className="flex-1 flex h-full">
      <div className="flex-1 flex flex-col min-w-0">

        <div className="h-12 px-4 flex items-center border-b border-border bg-secondary">
          {channelLoading ? (
            <div className="flex items-center space-x-2">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : channel ? (
            <div className='w-full flex items-center justify-between'>
              <div className='flex items-center'>
                <Hash className="h-5 w-5 text-muted-foreground mr-2" />
                <span className="font-semibold">{channel.name}</span>
              </div>


              <Button
                variant='outline'
                onClick={() => setShowMembers(!showMembers)}
                className="gap-2 cursor-pointer"
              >
                <Users className="h-4 w-4" />
                {channel.member_count}{" "}
                {channel.member_count === 1 ? "member" : "members"}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">Channel not found</p>
          )}
        </div>

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

      {showMembers && channel && (
        <div className="w-60 border-l border-border bg-secondary flex flex-col">
          <div className="h-12 px-4 flex items-center justify-between border-b border-border">
            <span className="font-semibold text-sm">Members</span>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowMembers(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {channelLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                members.map(member => {
                  const isAdmin = member.id === channel.admin.id
                  return (
                    <div
                      key={member.id}
                      className="px-2 py-1.5 rounded hover:bg-accent flex items-center gap-2"
                    >
                      {
                        isAdmin ?
                          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            {member.username?.[0]?.toUpperCase() ?? ""}
                          </div>
                          :
                          <div className="h-8 w-8 text-primary flex items-center justify-center">
                            {member.username?.[0]?.toUpperCase() ?? ""}
                          </div>
                      }

                      <span className="text-sm">
                        {member.username}
                        {isAdmin && " (Host)"}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
