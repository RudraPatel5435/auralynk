import { useEffect, useRef, useState, useCallback } from 'react'
import { toast } from 'sonner'

interface Peer {
  userId: string
  username: string
  connection: RTCPeerConnection
  stream?: MediaStream
}

interface SignalMessage {
  type: string
  channel_id: string
  from: string
  to?: string
  payload?: any
}

interface UseWebRTCProps {
  channelId: string
  enabled?: boolean
  onPeerJoined?: (userId: string, username: string) => void
  onPeerLeft?: (userId: string) => void
  onRemoteStream?: (userId: string, stream: MediaStream) => void
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
}

export const useWebRTC = ({
  channelId,
  enabled = true,
  onPeerJoined,
  onPeerLeft,
  onRemoteStream,
}: UseWebRTCProps) => {
  const [isConnected, setIsConnected] = useState(false)
  const [peers, setPeers] = useState<Peer[]>([])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [videoEnabled, setVideoEnabled] = useState(false)
  const [screenSharing, setScreenSharing] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const peersRef = useRef<Map<string, Peer>>(new Map())
  const localStreamRef = useRef<MediaStream | null>(null)
  const screenStreamRef = useRef<MediaStream | null>(null)

  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'

  // Update peers state from ref
  const updatePeersState = useCallback(() => {
    setPeers(Array.from(peersRef.current.values()))
  }, [])

  // Create peer connection
  const createPeerConnection = useCallback((userId: string, username: string): RTCPeerConnection => {
    console.log('Creating peer connection for:', username, userId)
    const pc = new RTCPeerConnection(RTC_CONFIG)

    // Add local stream tracks if available
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log('Adding local track:', track.kind)
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        console.log('Sending ICE candidate to:', username)
        const message: SignalMessage = {
          type: 'ice-candidate',
          channel_id: channelId,
          from: '',
          to: userId,
          payload: { candidate: event.candidate },
        }
        wsRef.current.send(JSON.stringify(message))
      }
    }

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track from:', username, event.track.kind)
      const stream = event.streams[0]

      const peer = peersRef.current.get(userId)
      if (peer) {
        peer.stream = stream
        peersRef.current.set(userId, peer)
        updatePeersState()
        onRemoteStream?.(userId, stream)
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${username}:`, pc.iceConnectionState)
      if (pc.iceConnectionState === 'failed') {
        console.log('ICE connection failed, restarting...')
        pc.restartIce()
      }
    }

    return pc
  }, [channelId, onRemoteStream, updatePeersState])

  // Remove peer
  const removePeer = useCallback((userId: string) => {
    console.log('Removing peer:', userId)
    const peer = peersRef.current.get(userId)
    if (peer) {
      peer.connection.close()
      peersRef.current.delete(userId)
      updatePeersState()
      onPeerLeft?.(userId)
    }
  }, [onPeerLeft, updatePeersState])

  // Send offer to peer
  const sendOffer = useCallback(async (userId: string) => {
    const peer = peersRef.current.get(userId)
    if (!peer || !wsRef.current) {
      console.log('Cannot send offer - peer or ws not available')
      return
    }

    try {
      console.log('Creating and sending offer to:', userId)
      const offer = await peer.connection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      })
      await peer.connection.setLocalDescription(offer)

      const message: SignalMessage = {
        type: 'offer',
        channel_id: channelId,
        from: '',
        to: userId,
        payload: { sdp: offer },
      }
      wsRef.current.send(JSON.stringify(message))
      console.log('Offer sent to:', userId)
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }, [channelId])

  // Handle incoming signals
  const handleSignal = useCallback(async (data: SignalMessage) => {
    console.log('Received signal:', data.type, 'from:', data.from)

    switch (data.type) {
      case 'existing-peers': {
        const existingPeers = data.payload.peers as Array<{ user_id: string; username: string }>
        console.log('Existing peers:', existingPeers)

        for (const peerInfo of existingPeers) {
          if (!peersRef.current.has(peerInfo.user_id)) {
            const pc = createPeerConnection(peerInfo.user_id, peerInfo.username)
            const peer: Peer = {
              userId: peerInfo.user_id,
              username: peerInfo.username,
              connection: pc,
            }
            peersRef.current.set(peerInfo.user_id, peer)
            onPeerJoined?.(peerInfo.user_id, peerInfo.username)
          }
        }
        updatePeersState()

        // Send offers to all existing peers
        for (const peerInfo of existingPeers) {
          await sendOffer(peerInfo.user_id)
        }
        break
      }

      case 'peer-joined': {
        const { user_id, username } = data.payload
        console.log('New peer joined:', username)

        if (!peersRef.current.has(user_id)) {
          const pc = createPeerConnection(user_id, username)
          const peer: Peer = {
            userId: user_id,
            username,
            connection: pc,
          }
          peersRef.current.set(user_id, peer)
          updatePeersState()
          onPeerJoined?.(user_id, username)
        }
        break
      }

      case 'peer-left': {
        const userId = data.payload.user_id
        console.log('Peer left:', userId)
        removePeer(userId)
        break
      }

      case 'offer': {
        console.log('Received offer from:', data.from)
        const peer = peersRef.current.get(data.from)
        if (!peer) {
          console.log('Peer not found for offer:', data.from)
          return
        }

        try {
          await peer.connection.setRemoteDescription(new RTCSessionDescription(data.payload.sdp))
          const answer = await peer.connection.createAnswer()
          await peer.connection.setLocalDescription(answer)

          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const message: SignalMessage = {
              type: 'answer',
              channel_id: channelId,
              from: '',
              to: data.from,
              payload: { sdp: answer },
            }
            wsRef.current.send(JSON.stringify(message))
            console.log('Answer sent to:', data.from)
          }
        } catch (error) {
          console.error('Error handling offer:', error)
        }
        break
      }

      case 'answer': {
        console.log('Received answer from:', data.from)
        const peer = peersRef.current.get(data.from)
        if (!peer) {
          console.log('Peer not found for answer:', data.from)
          return
        }

        try {
          await peer.connection.setRemoteDescription(new RTCSessionDescription(data.payload.sdp))
          console.log('Answer processed from:', data.from)
        } catch (error) {
          console.error('Error handling answer:', error)
        }
        break
      }

      case 'ice-candidate': {
        const peer = peersRef.current.get(data.from)
        if (!peer) {
          console.log('Peer not found for ICE candidate:', data.from)
          return
        }

        try {
          await peer.connection.addIceCandidate(new RTCIceCandidate(data.payload.candidate))
          console.log('ICE candidate added from:', data.from)
        } catch (error) {
          console.error('Error adding ICE candidate:', error)
        }
        break
      }
    }
  }, [channelId, createPeerConnection, onPeerJoined, removePeer, sendOffer, updatePeersState])

  // Toggle audio
  const toggleAudio = useCallback(async () => {
    try {
      if (!audioEnabled) {
        console.log('Enabling audio...')
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        const audioTrack = stream.getAudioTracks()[0]

        if (!localStreamRef.current) {
          localStreamRef.current = new MediaStream()
        }

        localStreamRef.current.addTrack(audioTrack)
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()))

        // Add track to all peer connections
        peersRef.current.forEach(peer => {
          const sender = peer.connection.getSenders().find(s => s.track?.kind === 'audio')
          if (sender) {
            sender.replaceTrack(audioTrack)
          } else {
            peer.connection.addTrack(audioTrack, localStreamRef.current!)
          }
        })

        setAudioEnabled(true)
        console.log('Audio enabled')

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'media-state',
            payload: { media_type: 'audio', is_active: true },
          }))
        }
      } else {
        console.log('Disabling audio...')
        localStreamRef.current?.getAudioTracks().forEach(track => {
          track.stop()
          localStreamRef.current!.removeTrack(track)
        })

        setLocalStream(localStreamRef.current ? new MediaStream(localStreamRef.current.getTracks()) : null)
        setAudioEnabled(false)

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'media-state',
            payload: { media_type: 'audio', is_active: false },
          }))
        }
      }
    } catch (error) {
      console.error('Error toggling audio:', error)
      toast.error('Failed to access microphone')
    }
  }, [audioEnabled])

  // Toggle video
  const toggleVideo = useCallback(async () => {
    try {
      if (!videoEnabled) {
        console.log('Enabling video...')
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })

        const videoTrack = stream.getVideoTracks()[0]

        if (!localStreamRef.current) {
          localStreamRef.current = new MediaStream()
        }

        localStreamRef.current.addTrack(videoTrack)
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()))

        peersRef.current.forEach(peer => {
          const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video')
          if (sender) {
            sender.replaceTrack(videoTrack)
          } else {
            peer.connection.addTrack(videoTrack, localStreamRef.current!)
          }
        })

        setVideoEnabled(true)
        console.log('Video enabled')

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'media-state',
            payload: { media_type: 'video', is_active: true },
          }))
        }
      } else {
        console.log('Disabling video...')
        localStreamRef.current?.getVideoTracks().forEach(track => {
          track.stop()
          localStreamRef.current!.removeTrack(track)
        })

        setLocalStream(localStreamRef.current ? new MediaStream(localStreamRef.current.getTracks()) : null)
        setVideoEnabled(false)

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'media-state',
            payload: { media_type: 'video', is_active: false },
          }))
        }
      }
    } catch (error) {
      console.error('Error toggling video:', error)
      toast.error('Failed to access camera')
    }
  }, [videoEnabled])

  // Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    try {
      if (!screenSharing) {
        console.log('Starting screen share...')
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        })

        screenStreamRef.current = stream
        const screenTrack = stream.getVideoTracks()[0]

        peersRef.current.forEach(peer => {
          const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video')
          if (sender) {
            sender.replaceTrack(screenTrack)
          } else {
            peer.connection.addTrack(screenTrack, stream)
          }
        })

        screenTrack.onended = () => {
          console.log('Screen share ended by user')
          toggleScreenShare()
        }

        setScreenSharing(true)

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'media-state',
            payload: { media_type: 'screen', is_active: true },
          }))
        }
      } else {
        console.log('Stopping screen share...')
        screenStreamRef.current?.getTracks().forEach(track => track.stop())
        screenStreamRef.current = null

        if (videoEnabled && localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0]
          if (videoTrack) {
            peersRef.current.forEach(peer => {
              const sender = peer.connection.getSenders().find(s => s.track?.kind === 'video')
              if (sender) {
                sender.replaceTrack(videoTrack)
              }
            })
          }
        }

        setScreenSharing(false)

        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'media-state',
            payload: { media_type: 'screen', is_active: false },
          }))
        }
      }
    } catch (error) {
      console.error('Error toggling screen share:', error)
      toast.error('Failed to share screen')
    }
  }, [screenSharing, videoEnabled])

  // Main effect - connect and cleanup
  useEffect(() => {
    // Don't connect if not enabled
    if (!enabled || !channelId) {
      console.log('WebRTC not enabled or no channelId')
      return
    }

    // Check if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected, skipping')
      return
    }

    console.log('🚀 Connecting to RTC signaling server...')

    try {
      const ws = new WebSocket(`${WS_URL}/rtc/${channelId}`)

      ws.onopen = () => {
        console.log('✅ RTC signaling connected')
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SignalMessage
          handleSignal(data)
        } catch (error) {
          console.error('Failed to parse signaling message:', error)
        }
      }

      ws.onerror = (error) => {
        console.error('❌ RTC signaling error:', error)
      }

      ws.onclose = (event) => {
        console.log('❌ RTC signaling closed:', event.code)
        setIsConnected(false)
        wsRef.current = null
      }

      wsRef.current = ws
    } catch (error) {
      console.error('Failed to connect to signaling server:', error)
      toast.error('Failed to connect to voice/video server')
    }

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up WebRTC connection...')

      // Close all peer connections
      peersRef.current.forEach(peer => {
        console.log('Closing peer connection:', peer.username)
        peer.connection.close()
      })
      peersRef.current.clear()
      setPeers([])

      // Stop all media tracks
      localStreamRef.current?.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind)
        track.stop()
      })
      screenStreamRef.current?.getTracks().forEach(track => track.stop())

      localStreamRef.current = null
      screenStreamRef.current = null
      setLocalStream(null)

      // Close WebSocket
      if (wsRef.current) {
        console.log('Closing WebSocket connection')
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close(1000, 'Component unmounting')
        }
        wsRef.current = null
      }

      setIsConnected(false)
      setAudioEnabled(false)
      setVideoEnabled(false)
      setScreenSharing(false)
    }
  }, [enabled, channelId]) // Only depend on enabled and channelId
  // handleSignal is NOT in deps to prevent reconnection loop

  return {
    isConnected,
    peers,
    localStream,
    audioEnabled,
    videoEnabled,
    screenSharing,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
  }
}
