import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface WebRTCDebugProps {
  channelId: string
  isConnected: boolean
  peers: any[]
  localStream: MediaStream | null
  audioEnabled: boolean
  videoEnabled: boolean
}

export const WebRTCDebug: React.FC<WebRTCDebugProps> = ({
  channelId,
  isConnected,
  peers,
  localStream,
  audioEnabled,
  videoEnabled,
}) => {
  const [show, setShow] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])

  useEffect(() => {
    // Get available devices
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setDevices(devices)
    })
  }, [])

  useEffect(() => {
    if (!show) return

    const newLog = `[${new Date().toLocaleTimeString()}] Connected: ${isConnected}, Peers: ${peers.length}, Audio: ${audioEnabled}, Video: ${videoEnabled}, LocalStream tracks: ${localStream?.getTracks().length || 0}`
    setLogs(prev => [...prev.slice(-19), newLog])
  }, [isConnected, peers.length, audioEnabled, videoEnabled, localStream, show])

  const testMicrophone = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('✅ Microphone access granted')
      stream.getTracks().forEach(track => track.stop())
      setLogs(prev => [...prev, `✅ Microphone test passed`])
    } catch (error) {
      console.error('❌ Microphone access denied:', error)
      setLogs(prev => [...prev, `❌ Microphone test failed: ${error}`])
    }
  }

  const testCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      console.log('✅ Camera access granted')
      stream.getTracks().forEach(track => track.stop())
      setLogs(prev => [...prev, `✅ Camera test passed`])
    } catch (error) {
      console.error('❌ Camera access denied:', error)
      setLogs(prev => [...prev, `❌ Camera test failed: ${error}`])
    }
  }

  const testWebSocket = async () => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
    try {
      const ws = new WebSocket(`${WS_URL}/rtc/${channelId}`)
      ws.onopen = () => {
        console.log('✅ WebSocket connected')
        setLogs(prev => [...prev, `✅ WebSocket test passed`])
        ws.close()
      }
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error)
        setLogs(prev => [...prev, `❌ WebSocket test failed`])
      }
    } catch (error) {
      console.error('❌ WebSocket test failed:', error)
      setLogs(prev => [...prev, `❌ WebSocket test failed: ${error}`])
    }
  }

  if (!show) {
    return (
      <Button
        onClick={() => setShow(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50"
      >
        Show WebRTC Debug
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[600px] overflow-auto z-50 shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">WebRTC Debug</CardTitle>
        <Button onClick={() => setShow(false)} variant="ghost" size="sm">
          Hide
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Connection:</span>
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? '✅ Connected' : '❌ Disconnected'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Peers:</span>
            <span>{peers.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Audio:</span>
            <span className={audioEnabled ? 'text-green-600' : 'text-gray-600'}>
              {audioEnabled ? '✅ Enabled' : '⭕ Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Video:</span>
            <span className={videoEnabled ? 'text-green-600' : 'text-gray-600'}>
              {videoEnabled ? '✅ Enabled' : '⭕ Disabled'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Local Tracks:</span>
            <span>{localStream?.getTracks().length || 0}</span>
          </div>
        </div>

        {/* Local Stream Info */}
        {localStream && (
          <div className="space-y-1 text-xs border-t pt-2">
            <div className="font-semibold">Local Stream:</div>
            {localStream.getTracks().map((track, idx) => (
              <div key={idx} className="pl-2">
                • {track.kind}: {track.enabled ? '✅' : '❌'} {track.label}
              </div>
            ))}
          </div>
        )}

        {/* Peers Info */}
        {peers.length > 0 && (
          <div className="space-y-1 text-xs border-t pt-2">
            <div className="font-semibold">Peers:</div>
            {peers.map((peer, idx) => (
              <div key={idx} className="pl-2">
                • {peer.username} ({peer.userId.substring(0, 8)}...)
                {peer.stream && (
                  <div className="pl-4 text-gray-600">
                    Tracks: {peer.stream.getTracks().length}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Devices */}
        <div className="space-y-1 text-xs border-t pt-2">
          <div className="font-semibold">Available Devices:</div>
          <div className="pl-2 space-y-1">
            <div>
              Audio: {devices.filter(d => d.kind === 'audioinput').length}
            </div>
            <div>
              Video: {devices.filter(d => d.kind === 'videoinput').length}
            </div>
          </div>
        </div>

        {/* Tests */}
        <div className="space-y-2 border-t pt-2">
          <div className="font-semibold text-xs">Run Tests:</div>
          <div className="flex gap-2">
            <Button onClick={testMicrophone} size="sm" variant="outline">
              Test Mic
            </Button>
            <Button onClick={testCamera} size="sm" variant="outline">
              Test Cam
            </Button>
            <Button onClick={testWebSocket} size="sm" variant="outline">
              Test WS
            </Button>
          </div>
        </div>

        {/* Logs */}
        <div className="space-y-1 text-xs border-t pt-2">
          <div className="font-semibold">Logs:</div>
          <div className="bg-black/5 p-2 rounded max-h-32 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet</div>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="font-mono text-[10px]">
                  {log}
                </div>
              ))
            )}
          </div>
          <Button
            onClick={() => setLogs([])}
            size="sm"
            variant="ghost"
            className="w-full"
          >
            Clear Logs
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
