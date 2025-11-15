import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api"

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
    queryKey: [`channel-${channelId}`, channelId],
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

    joinChannel: joinMutation.mutateAsync,
    leaveChannel: leaveMutation.mutateAsync,
    createChannel: createMutation.mutateAsync,
  }
}

// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { channelApi } from '@/lib/api';
//
// export const channelKeys = {
//   all: ['channels'] as const,
//   lists: () => [...channelKeys.all, 'list'] as const,
//   list: (filters?: Record<string, unknown>) => [...channelKeys.lists(), filters] as const,
//   details: () => [...channelKeys.all, 'detail'] as const,
//   detail: (id: string) => [...channelKeys.details(), id] as const,
// };
//
// export function useChannels() {
//   return useQuery({
//     queryKey: channelKeys.lists(),
//     queryFn: channelApi.getChannels,
//     staleTime: 1000 * 60 * 5,
//   });
// }
//
// export function useChannel(id: string) {
//   return useQuery({
//     queryKey: channelKeys.detail(id),
//     queryFn: () => channelApi.getChannel(id),
//     enabled: !!id,
//     staleTime: 1000 * 60 * 5,
//   });
// }
//
// export function useCreateChannel() {
//   const queryClient = useQueryClient();
//   
//   return useMutation({
//     mutationFn: channelApi.createChannel,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
//     },
//   });
// }
//
// export function useUpdateChannel() {
//   const queryClient = useQueryClient();
//   
//   return useMutation({
//     mutationFn: ({ id, ...data }: { id: string; name?: string; access_type?: 'public' | 'private' }) =>
//       channelApi.updateChannel(id, data),
//     onSuccess: (data, variables) => {
//       queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: channelKeys.detail(variables.id) });
//     },
//   });
// }
//
// export function useDeleteChannel() {
//   const queryClient = useQueryClient();
//   
//   return useMutation({
//     mutationFn: channelApi.deleteChannel,
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
//     },
//   });
// }
//
// export function useJoinChannel() {
//   const queryClient = useQueryClient();
//   
//   return useMutation({
//     mutationFn: channelApi.joinChannel,
//     onSuccess: (data, channelId) => {
//       queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) });
//     },
//   });
// }
//
// export function useLeaveChannel() {
//   const queryClient = useQueryClient();
//   
//   return useMutation({
//     mutationFn: channelApi.leaveChannel,
//     onSuccess: (data, channelId) => {
//       queryClient.invalidateQueries({ queryKey: channelKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: channelKeys.detail(channelId) });
//     },
//   });
// }
