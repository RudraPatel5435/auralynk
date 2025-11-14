import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Members {
  id: string
  username: string
}

export interface Channel {
  id: string
  name: string
  access_type: string
  admin_id: string
  admin_username: string
  is_member: boolean
  is_admin: boolean
  member_count: number
  members: Members
  created_at: string
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export const useChannels = () => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channel, setChannel] = useState<Channel>()
  const [channelsLoading, setChannelsLoading] = useState(false)
  const [channelActionsLoading, setChannelActionsLoading] = useState(false)

  useEffect(() => {
    fetchChannels()
  }, [])

  const fetchChannels = async () => {
    setChannelsLoading(true)
    try {
      const res = await fetch(`${API_URL}/channels`, {
        method: "GET",
        credentials: "include",
      })

      if (!res.ok) throw new Error("Failed to fetch channels")

      const data = await res.json()
      const channelList = data.data || data
      setChannels(channelList)
      return true
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Error fetching channels")
      return false
    } finally {
      setChannelsLoading(false)
    }
  }

  const fetchChannel = async (id: string) => {
    setChannelsLoading(true)
    try {
      const res = await fetch(`${API_URL}/channels/${id}`, {
        method: "GET",
        credentials: "include",
      })

      if (!res.ok) throw new Error("Failed to fetch channel")

      const data = await res.json()
      setChannel(data.data)
      return true
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Error fetching channel")
      return false
    } finally {
      setChannelsLoading(false)
    }
  }

  const joinChannel = async (channelId: string) => {
    setChannelActionsLoading(true)
    try {
      const res = await fetch(`${API_URL}/channels/${channelId}/join`, {
        method: "POST",
        credentials: "include"
      })

      if (!res.ok) throw new Error("Failed to join channel")

      const data = await res.json()
      if (data.success) {
        toast.success(`Joined ${data.channel_name} successfully!`)
        return true
      } else {
        throw new Error(data.message || "Failed to join channel")
      }
    } catch (err) {
      console.error(err || "")
      toast.error(`${err}` || "Error joining channel")
      return false
    } finally {
      setChannelActionsLoading(false)
    }

  }

  const leaveChannel = async (channelId: string) => {
    try {
      const res = await fetch(`${API_URL}/channels/${channelId}/leave`, {
        method: "POST",
        credentials: "include",
      })

      if (!res.ok) throw new Error("Failed to leave channel")

      const data = await res.json()

      if (data.success) {
        toast.success("Left channel successfully")
        await fetchChannels()
        return true
      } else {
        throw new Error(data.message || "Failed to leave channel")
      }
    } catch (err) {
      console.error(err)
      toast.error(`${err}` || "Error leaving channel")
      return false
    } finally {
      setChannelActionsLoading(false)
    }
  }

  const createChannel = async (name: string, access_type: string) => {
    setChannelActionsLoading(true)
    try {
      const res = await fetch(`${API_URL}/channels/create`, {
        method: "POST",
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, access_type })
      })

      if (!res.ok) throw new Error("Failed to create channel")

      const data = await res.json()
      if (data.success) {
        toast.success("Channel created successfully")
        await fetchChannels()
        return true
      }
    } catch (err) {
      console.error(err)
      toast.error(`${err}` || 'Create channel failed')
      return false
    }
  }


  return {
    channels,
    channel,
    channelsLoading,
    refreshChannels: fetchChannels,
    fetchChannel,
    joinChannel,
    leaveChannel,
    createChannel,
    channelActionsLoading,
  }
}
