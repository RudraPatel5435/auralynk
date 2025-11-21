import { channelApi } from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

export interface Members {
  id: string
  username: string
}

export interface Channel {
  id: string
  name: string
  access_type: string
  admin: Members
  is_member: boolean
  is_admin: boolean
  member_count: number
  members: Members[]
  created_at: string
}

export const useChannels = (channelId?: string) => {
  const queryClient = useQueryClient()

  const {
    data: channels = [] as Channel[],
    isLoading: channelsLoading,
    refetch: refreshChannels,
  } = useQuery<Channel[]>({
    queryKey: ["channels"],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/channels`, {
        credentials: "include",
        method: "GET",
      })
      if (!res.ok) throw new Error("Failed to load channels")
      const data = await res.json()
      return data.data || data
    },
  })

  const {
    data: channel,
    isLoading: channelLoading,
  } = useQuery<Channel>({
    queryKey: ["channel", channelId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/channels/${channelId}`, {
        method: "GET",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to load channel")
      const data = await res.json()
      return data.data
    },
    enabled: !!channelId,
  })

  const joinMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const res = await fetch(`${API_URL}/channels/${channelId}/join`, {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to join channel")
      return await res.json()
    },
    onSuccess: (data) => {
      toast.success(`Joined #${data.channel_name}`)
      queryClient.invalidateQueries({ queryKey: ["channels"] })
    },
    onError: (err: any) => {
      toast.error(err.message || "Joining failed")
    },
  })

  const leaveMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const res = await fetch(`${API_URL}/channels/${channelId}/leave`, {
        method: "POST",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Failed to leave channel")
      return await res.json()
    },
    onSuccess: (data) => {
      toast.success("Left the channel")
      queryClient.invalidateQueries({ queryKey: ["channels"] })
      queryClient.invalidateQueries({ queryKey: ["channel", data.id] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; access_type: string }) => {
      const res = await fetch(`${API_URL}/channels/create`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error("Failed to create channel")
      return await res.json()
    },
    onSuccess: () => {
      toast.success("Channel created")
      queryClient.invalidateQueries({ queryKey: ["channels"] })
    },
    onError: (err: any) => toast.error(err.message),
  })

  const changeTypeMutation = useMutation({
    mutationFn: async (payload: { id: string; access_type: string }) =>
      channelApi.changeChannelType(payload.id, payload.access_type),

    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["channel", channelId] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },

    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const changeNameMutation = useMutation({
    mutationFn: async (payload: { id: string, name: string }) =>
      channelApi.changeChannelName(payload.id, payload.name),

    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["channel", channelId] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },

    onError: (err: any) => {
      toast.error(err.message);
    },
  })

  return {
    channels,
    channel,
    refreshChannels,

    channelsLoading,
    channelLoading,
    channelActionsLoading:
      joinMutation.isPending ||
      leaveMutation.isPending ||
      createMutation.isPending,
    changeTypeLoading: changeTypeMutation.isPending,
    changeNameLoading: changeNameMutation.isPending,

    joinChannel: joinMutation.mutateAsync,
    leaveChannel: leaveMutation.mutateAsync,
    createChannel: createMutation.mutateAsync,
    changeType: (id: string, access_type: string) => changeTypeMutation.mutate({ id, access_type }),
    changeName: (id: string, name: string) => changeNameMutation.mutate({ id, name }),
  }
}
