import { useEffect, useState } from "react"
import { toast } from "sonner"

export interface Channel {
  id: string
  name: string
  access_type: string
  admin_id: string
  is_member: boolean
  is_admin: boolean
  member_count: number
  created_at: string // ISO date string
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export const useChannels = () => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelsLoading, setChannelsLoading] = useState(false)

  const fetchChannels = async () => {
    setChannelsLoading(true)
    try {
      const res = await fetch(`${API_URL}/channels`, {
        method: "GET",
        credentials: "include",
      })

      if (!res.ok) throw new Error("Failed to fetch channels")

      const data = await res.json()
      console.log(data)

      const channelList = data.data || data
      setChannels(channelList)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : "Error fetching channels")
    } finally {
      setChannelsLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  return {
    channels,
    channelsLoading,
    refreshChannels: fetchChannels,
  }
}
