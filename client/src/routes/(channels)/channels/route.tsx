import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChannels } from '@/hooks/useChannels'
import { useAuth } from '@/hooks/useAuth'
import { useAuthActions } from '@/hooks/useAuthActions'
import { useState } from 'react'
import {
  Hash,
  Users,
  Search,
  Settings,
  LogOut,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Headphones,
  Volume2,
  Plus,
  UserPlus,
  ChevronDown,
  Loader2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import CreateChannel from '@/components/channelActions/CreateChannel'

export const Route = createFileRoute('/(channels)/channels')({
  component: RouteComponent,
})

function RouteComponent() {
  const { channels, channelsLoading, joinChannel } = useChannels()
  const { user } = useAuth()
  const { logout } = useAuthActions()

  const [micEnabled, setMicEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [showFriends, setShowFriends] = useState(false)
  const [joinChannelName, setJoinChannelName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isJoining, setIsJoining] = useState(false)

  const handleJoinChannel = async () => {
    setIsJoining(true)
    const success = await joinChannel(joinChannelName)
    if (success) setJoinChannelName('')
    setIsJoining(false)
  }

  const userChannels = channels.filter(ch => ch.is_member)

  if (channelsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-60 flex flex-col border-r border-border">
        {/* Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-border">
          <h1 className="font-semibold">Auralynk</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setShowFriends(false)}>
                <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                Channels
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowFriends(true)}>
                <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                Friends & DMs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Plus className="mr-2 h-4 w-4 text-muted-foreground" />
                    Join Channel
                  </DropdownMenuItem>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Join a Channel</DialogTitle>
                    <DialogDescription>
                      Enter the channel name to join
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="channel-name">Channel Name</Label>
                      <Input
                        id="channel-name"
                        placeholder="general, dev-team..."
                        value={joinChannelName}
                        onChange={(e) => setJoinChannelName(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleJoinChannel}
                      className="w-full"
                      disabled={!joinChannelName.trim() || isJoining}
                    >
                      {isJoining ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        'Join Channel'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Create Channel */}
        <CreateChannel />

        {/* Search */}
        <div className="px-2 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8 bg-[hsl(var(--color-bg))] border-[hsl(var(--color-border))] text-sm h-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto px-2">
          {!showFriends ? (
            <div className="space-y-0.5">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground-foreground uppercase">
                Your Channels ({userChannels.length})
              </div>
              {userChannels.length === 0 ? (
                <p className="px-2 py-4 text-sm text-muted-foreground-foreground">
                  No channels joined yet. Use the menu to join one!
                </p>
              ) : (
                userChannels
                  .filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((channel) => (
                    <Button
                      variant='ghost'
                      key={channel.id}
                    >
                      <Link
                        to='/channels/$id'
                        params={{ id: channel.id }}
                        className={`flex items-center justify-start`}
                      >
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm truncate">{channel.name}</span>
                      </Link>
                    </Button>
                  ))
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
                <span>Friends</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              <p className="px-2 py-4 text-sm text-muted-foreground">
                Friends feature coming soon!
              </p>
            </div>
          )}
        </div>

        {/* User Controls */}
        <div className="p-2 bg-background border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-primary-foreground">
                {user?.username[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{user?.username}</div>
                <div className="text-xs text-muted-foreground-foreground truncate">Online</div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4 text-muted-foreground-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Audio/Video Controls */}
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMicEnabled(!micEnabled)}
              className={`flex-1 ${!micEnabled ? 'text-destructive' : ''}`}
            >
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVideoEnabled(!videoEnabled)}
              className={`flex-1 ${!videoEnabled ? 'text-destructive' : ''}`}
            >
              {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`flex-1 ${!audioEnabled ? 'text-destructive' : ''}`}
            >
              {audioEnabled ? <Headphones className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Outlet />
    </div>
  )
}
