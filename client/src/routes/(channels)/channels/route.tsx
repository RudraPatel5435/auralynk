import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useChannels } from '@/hooks/useChannels'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { useState } from 'react'
import { Hash, Users, Search, Settings, LogOut, ChevronDown, Loader2 } from 'lucide-react'
import CreateChannel from '@/components/channelActions/CreateChannel'
import JoinChannel from '@/components/dev/join-channel'

export const Route = createFileRoute('/(channels)/channels')({
  component: RouteComponent,
})

function RouteComponent() {
  const { channels, channelsLoading } = useChannels()
  const { data: user, isLoading: isLoading } = useCurrentUser()
  const { mutateAsync: logout, isPending: isLoggingOut } = useLogout()

  const [showFriends, setShowFriends] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const userChannels = channels.filter(ch => ch.is_member && ch.is_admin)
  const joinedChannels = channels.filter(ch => ch.is_member && !ch.is_admin)

  if (channelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex flex-col border-r border-border w-64 bg-muted/20">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h1 className="font-semibold">Vyenet</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => setShowFriends(false)}>
                <Hash className="mr-2 h-4 w-4" /> DevSpaces
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowFriends(true)}>
                <Users className="mr-2 h-4 w-4" /> Friends & DMs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <JoinChannel />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CreateChannel />

        <div className="px-2">
          <Button variant="ghost" className="w-full justify-start gap-2" asChild>
            <Link to="/channels/@dev">
              <Hash className="h-4 w-4" /> My DevSpace
            </Link>
          </Button>
        </div>

        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="pl-8" />
          </div>
        </div>

        <ScrollArea className="flex-1 px-2">
          {!showFriends ? (
            <div>
              <div className="text-xs uppercase text-muted-foreground px-2 py-2 font-semibold">
                Your DevSpaces ({userChannels.length})
              </div>

              <div className="space-y-1">
                {userChannels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(channel => (
                  <Button key={channel.id} variant="ghost" className="flex w-full justify-start gap-2 px-2" asChild>
                    <Link to="/channels/$id" params={{ id: channel.id }}>
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span>{channel.name}</span>
                    </Link>
                  </Button>
                ))}

                {userChannels.length === 0 && (
                  <p className="px-2 py-4 text-sm text-muted-foreground">No channels created yet.</p>
                )}
              </div>

              <div className="text-xs uppercase text-muted-foreground px-2 py-2 font-semibold">
                Joined DevSpaces ({joinedChannels.length})
              </div>

              <div className="space-y-1">
                {joinedChannels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(channel => (
                  <Button key={channel.id} variant="ghost" className="flex w-full justify-start gap-2 px-2" asChild>
                    <Link to="/channels/$id" params={{ id: channel.id }}>
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span>{channel.name}</span>
                    </Link>
                  </Button>
                ))}

                {joinedChannels.length === 0 && (
                  <p className="px-2 py-4 text-sm text-muted-foreground">No spaces joined yet.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-2 text-sm text-muted-foreground">Friends coming soon…</div>
          )}
        </ScrollArea>

        <div className="p-3 border-t border-border bg-muted/10 space-y-3">
          <div className="flex items-center justify-between">
            {
              isLoading ?
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    .
                  </div>
                  <div>
                    <p className="text-sm font-medium">Loading</p>
                    <p className="text-xs text-muted-foreground">...</p>
                  </div>
                </div>
                :
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    {user?.username?.[0]?.toUpperCase() ?? ""}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user?.username}</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
            }

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
