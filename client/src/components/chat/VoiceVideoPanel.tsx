import React, { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Phone, PhoneOff, Maximize2, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useWebRTC } from '@/hooks/useWebRTC'
import { useCurrentUser } from '@/hooks/useAuth'

// Inline Debug Panel Component
interface Peer {
  userId: string
  username: string
  connection: RTCPeerConnection
  stream?: MediaStream
}

interface WebRTCDebugPanelProps {
  isConnected: boolean
  peers: Peer[]
  localStream: MediaStream | null
  audioEnabled: boolean
  videoEnabled: boolean
  screenSharing: boolean
  remoteStreamsCount: number
}

const WebRTCDebugPanel: React.FC<WebRTCDebugPanelProps> = ({
  isConnected,
  peers,
  localStream,
  audioEnabled,
  videoEnabled,
  screenSharing,
  remoteStreamsCount,
}) => {
  const [show, setShow] = useState(true)

  if (!show) {
    return (
      <Button
        onClick={() => setShow(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        Debug
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[600px] overflow-auto z-50 shadow-xl bg-card border rounded-lg">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="text-sm font-medium">WebRTC Debug</div>
        <Button onClick={() => setShow(false)} variant="ghost" size="sm">Hide</Button>
      </div>
      <div className="p-3 space-y-3 text-xs">
        <div>
          <div className="font-semibold mb-1">Status:</div>
          <div>WS: {isConnected ? '✅' : '❌'} | Peers: {peers.length} | Streams: {remoteStreamsCount}</div>
          <div>Audio: {audioEnabled ? '✅' : '❌'} | Video: {videoEnabled ? '✅' : '❌'} | Screen: {screenSharing ? '✅' : '❌'}</div>
        </div>

        {peers.map((peer, idx) => (
          <div key={idx} className="border-l-2 border-primary/30 pl-2 space-y-1">
            <div className="font-medium">{peer.username}</div>
            <div>Conn: {peer.connection.connectionState}</div>
            <div>ICE: {peer.connection.iceConnectionState}</div>
            <div>Stream: {peer.stream ? `✅ (${peer.stream.getTracks().length} tracks)` : '❌ No stream'}</div>
          </div>
        ))}

        <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded">
          <div className="font-semibold">Open Console (F12)</div>
          <div>Look for: 🎥 "Received remote track"</div>
        </div>
      </div>
    </div>
  )
}

interface VoiceVideoPanelProps {
  channelId: string
  channelName: string
}

export const VoiceVideoPanel: React.FC<VoiceVideoPanelProps> = ({ channelId, channelName }) => {
  const { data: currentUser } = useCurrentUser()
  const [isInCall, setIsInCall] = useState(false)
  const [remoteStreams, setRemoteStreams] = useState<Map<string, { stream: MediaStream; username: string }>>(new Map())

  const localVideoRef = useRef<HTMLVideoElement>(null)

  const {
    isConnected,
    peers,
    localStream,
    audioEnabled,
    videoEnabled,
    screenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  } = useWebRTC({
    channelId,
    enabled: isInCall,
    onPeerJoined: (userId, username) => {
      console.log(`${username} joined the call`)
    },
    onPeerLeft: (userId) => {
      console.log(`Peer ${userId} left`)
      setRemoteStreams(prev => {
        const newStreams = new Map(prev)
        newStreams.delete(userId)
        return newStreams
      })
    },
    onRemoteStream: (userId, stream) => {
      console.log(`Received stream from ${userId}`, stream)
      const peer = peers.find(p => p.userId === userId)
      if (peer) {
        console.log(`Setting remote stream for ${peer.username}`)
        setRemoteStreams(prev => {
          const newStreams = new Map(prev)
          newStreams.set(userId, { stream, username: peer.username })
          return newStreams
        })
      } else {
        console.warn(`Peer not found for userId ${userId}`)
      }
    },
  })

  // Update remote streams when peers change
  useEffect(() => {
    console.log('Peers updated:', peers.length)
    setRemoteStreams(prev => {
      const newStreams = new Map(prev)

      // Add or update streams for peers that have them
      peers.forEach(peer => {
        if (peer.stream) {
          console.log(`Updating stream for peer ${peer.username}`)
          newStreams.set(peer.userId, {
            stream: peer.stream,
            username: peer.username
          })
        }
      })

      // Remove streams for peers that left
      const currentPeerIds = new Set(peers.map(p => p.userId))
      Array.from(newStreams.keys()).forEach(userId => {
        if (!currentPeerIds.has(userId)) {
          console.log(`Removing stream for disconnected peer ${userId}`)
          newStreams.delete(userId)
        }
      })

      return newStreams
    })
  }, [peers])

  // Update local video element when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('Setting local stream to video element', localStream.getTracks())
      localVideoRef.current.srcObject = localStream
    } else if (localVideoRef.current && !localStream) {
      localVideoRef.current.srcObject = null
    }
  }, [localStream])

  const handleJoinCall = () => {
    console.log('Joining call...')
    setIsInCall(true)
  }

  const handleLeaveCall = () => {
    console.log('Leaving call...')
    setIsInCall(false)
    setRemoteStreams(new Map())
  }

  if (!isInCall) {
    return (
      <div className="p-4 border-r border-border bg-muted/10">
        <div className="flex flex-col gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-medium">Voice & Video Chat</span>
          </div>
          <Button onClick={handleJoinCall} size="sm" className="gap-2">
            <Phone className="h-4 w-4" />
            Join Call
          </Button>
        </div>
      </div>
    )
  }

  // Count total participants (including self)
  const totalParticipants = peers.length + 1

  console.log('Rendering VoiceVideoPanel:', {
    peers: peers.length,
    remoteStreams: remoteStreams.size,
    localStream: !!localStream,
    videoEnabled,
    screenSharing
  })

  return (
    <div className="flex flex-col h-full border-r border-border bg-secondary/30 w-80">
      {/* Debug Panel */}
      <WebRTCDebugPanel
        isConnected={isConnected}
        peers={peers}
        localStream={localStream}
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        screenSharing={screenSharing}
        remoteStreamsCount={remoteStreams.size}
      />

      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Voice Chat</span>
          {isConnected && (
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" title="Connected" />
          )}
          {!isConnected && (
            <span className="h-2 w-2 rounded-full bg-yellow-500" title="Connecting..." />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLeaveCall}
          className="h-7 w-7 text-destructive hover:text-destructive"
          title="Leave call"
        >
          <PhoneOff className="h-4 w-4" />
        </Button>
      </div>

      {/* Video Grid */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {/* Local Video */}
        {(videoEnabled || screenSharing) && (
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white">
              {currentUser?.username} (You)
            </div>
            {audioEnabled && (
              <div className="absolute top-2 right-2 p-1.5 bg-green-500 rounded-full">
                <Mic className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Remote Videos */}
        {Array.from(remoteStreams.entries()).map(([userId, { stream, username }]) => {
          console.log(`Rendering RemoteVideo for ${username}`)
          return (
            <RemoteVideo
              key={userId}
              stream={stream}
              username={username}
            />
          )
        })}

        {/* Participants List (audio only) */}
        <div className="space-y-2">
          {/* Self (if audio only) */}
          {audioEnabled && !videoEnabled && !screenSharing && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-accent/50">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                {currentUser?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">{currentUser?.username} (You)</span>
              </div>
              <div className="p-1.5 bg-green-500 rounded-full">
                <Mic className="h-3 w-3 text-white" />
              </div>
            </div>
          )}

          {/* Self (if no media) */}
          {!audioEnabled && !videoEnabled && !screenSharing && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                {currentUser?.username?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium">{currentUser?.username} (You)</span>
              </div>
              <div className="p-1.5 bg-muted rounded-full">
                <MicOff className="h-3 w-3" />
              </div>
            </div>
          )}

          {/* Other peers without video */}
          {peers.map(peer => {
            const hasVideo = remoteStreams.has(peer.userId)
            if (hasVideo) return null

            return (
              <div
                key={peer.userId}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                  {peer.username[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium">{peer.username}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 border-t border-border space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant={audioEnabled ? 'default' : 'destructive'}
            size="sm"
            onClick={toggleAudio}
            className="flex-col h-auto py-2"
            title={audioEnabled ? 'Mute' : 'Unmute'}
          >
            {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            <span className="text-xs mt-1">Mic</span>
          </Button>

          <Button
            variant={videoEnabled ? 'default' : 'destructive'}
            size="sm"
            onClick={toggleVideo}
            className="flex-col h-auto py-2"
            title={videoEnabled ? 'Stop video' : 'Start video'}
          >
            {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            <span className="text-xs mt-1">Video</span>
          </Button>

          <Button
            variant={screenSharing ? 'default' : 'outline'}
            size="sm"
            onClick={toggleScreenShare}
            className="flex-col h-auto py-2"
            title={screenSharing ? 'Stop sharing' : 'Share screen'}
          >
            {screenSharing ? <Monitor className="h-4 w-4" /> : <MonitorOff className="h-4 w-4" />}
            <span className="text-xs mt-1">Screen</span>
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          {totalParticipants} {totalParticipants === 1 ? 'participant' : 'participants'} in call
        </div>
      </div>
    </div>
  )
}

interface RemoteVideoProps {
  stream: MediaStream
  username: string
}

const RemoteVideo: React.FC<RemoteVideoProps> = ({ stream, username }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    console.log('RemoteVideo: Setting stream for:', username, stream.getTracks())

    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      console.log('Video element srcObject set')
    }
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream
      console.log('Audio element srcObject set')
    }

    // Force play after a small delay
    const timer = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(err => {
          console.error('Failed to play video:', err)
        })
      }
      if (audioRef.current) {
        audioRef.current.play().catch(err => {
          console.error('Failed to play audio:', err)
        })
      }
    }, 100)

    return () => clearTimeout(timer)
  }, [stream, username])

  const toggleFullscreen = () => {
    if (!videoRef.current) return

    if (!isFullscreen) {
      videoRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const hasAudio = stream.getAudioTracks().length > 0
  const hasVideo = stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled

  console.log(`RemoteVideo render: ${username}, hasVideo: ${hasVideo}, hasAudio: ${hasAudio}`)

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
      {hasVideo ? (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          {/* Hidden audio element for audio playback */}
          <audio ref={audioRef} autoPlay />
        </>
      ) : (
        <>
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-semibold">
              {username[0]?.toUpperCase()}
            </div>
          </div>
          {/* Audio element for audio-only */}
          <audio ref={audioRef} autoPlay />
        </>
      )}

      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 rounded text-xs text-white flex items-center gap-1">
        {username}
        {hasAudio && (
          <Mic className="h-3 w-3 text-green-400" />
        )}
      </div>

      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {hasAudio && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="h-7 w-7 bg-black/50 hover:bg-black/70"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4 text-white" />
            ) : (
              <Volume2 className="h-4 w-4 text-white" />
            )}
          </Button>
        )}
        {hasVideo && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-7 w-7 bg-black/50 hover:bg-black/70"
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4 text-white" />
          </Button>
        )}
      </div>
    </div>
  )
}
