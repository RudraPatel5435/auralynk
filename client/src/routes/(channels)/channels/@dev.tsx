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
import { createFileRoute } from '@tanstack/react-router'
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
// import { ProtectedRoute } from '@/components/ProtectedRoute'

export const Route = createFileRoute('/(channels)/channels/@dev')({
  component: () => <RouteComponent />
})

function RouteComponent() {
  const { channels, channelsLoading, joinChannel } = useChannels()
  const { user } = useAuth()
  const { logout } = useAuthActions()

  const [micEnabled, setMicEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [selectedChannel, setSelectedChannel] = useState(channels[0])
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
      <div className="min-h-screen flex items-center justify-center app-bg">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen app-bg">
      {/* Left Sidebar */}
      <div className="w-60 app-panel flex flex-col border-r app-border">
        {/* Header */}
        <div className="h-12 px-4 flex items-center justify-between border-b app-border">
          <h1 className="font-semibold">Auralynk</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <ChevronDown className="h-4 w-4 text-muted" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setShowFriends(false)}>
                <Hash className="mr-2 h-4 w-4 text-muted" />
                Channels
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowFriends(true)}>
                <Users className="mr-2 h-4 w-4 text-muted" />
                Friends & DMs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Dialog>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Plus className="mr-2 h-4 w-4 text-muted" />
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

        {/* Search */}
        <div className="px-2 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted" />
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
              <div className="px-2 py-1.5 text-xs font-semibold text-muted uppercase">
                Your Channels ({userChannels.length})
              </div>
              {userChannels.length === 0 ? (
                <p className="px-2 py-4 text-sm text-muted">
                  No channels joined yet. Use the menu to join one!
                </p>
              ) : (
                userChannels
                  .filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition-colors
                        ${selectedChannel?.id === channel.id
                          ? 'bg-[hsl(var(--color-border))]'
                          : 'hover:bg-[hsl(var(--color-bg-secondary))]'
                        }`}
                    >
                      <Hash className="h-4 w-4 text-muted" />
                      <span className="text-sm truncate">{channel.name}</span>
                    </button>
                  ))
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted uppercase flex items-center justify-between">
                <span>Friends</span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <UserPlus className="h-4 w-4 text-muted" />
                </Button>
              </div>
              <p className="px-2 py-4 text-sm text-muted">
                Friends feature coming soon!
              </p>
            </div>
          )}
        </div>

        {/* User Controls */}
        <div className="p-2 bg-[hsl(var(--color-bg))] border-t app-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white">
                {user?.username[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{user?.username}</div>
                <div className="text-xs text-muted truncate">Online</div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="h-4 w-4 text-muted" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="text-red-500">
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
              className={`flex-1 ${!micEnabled ? 'text-red-500' : ''}`}
            >
              {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVideoEnabled(!videoEnabled)}
              className={`flex-1 ${!videoEnabled ? 'text-red-500' : ''}`}
            >
              {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAudioEnabled(!audioEnabled)}
              className={`flex-1 ${!audioEnabled ? 'text-red-500' : ''}`}
            >
              {audioEnabled ? <Headphones className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="h-12 px-4 flex items-center border-b app-border bg-[hsl(var(--color-bg-secondary))]">
          {selectedChannel ? (
            <>
              <Hash className="h-5 w-5 text-muted mr-2" />
              <span className="font-semibold">{selectedChannel.name}</span>
            </>
          ) : (
            <span className="font-semibold">Welcome to Auralynk</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 text-center text-muted">
          {selectedChannel ? (
            <div className="py-8">
              <Hash className="h-16 w-16 mx-auto mb-4 text-[hsl(var(--color-border))]" />
              <h3 className="text-xl font-semibold mb-2 text-[hsl(var(--color-text))]">
                Welcome to #{selectedChannel.name}
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
    </div>
  )
}
