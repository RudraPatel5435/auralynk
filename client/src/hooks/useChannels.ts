import { channelApi } from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

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
    queryFn: channelApi.getChannels,
    staleTime: 1000 * 60,
  })

  const {
    data: channel,
    isLoading: channelLoading,
  } = useQuery<Channel>({
    queryKey: ["channel", channelId],
    queryFn: () => channelApi.getChannel(channelId!),
    enabled: !!channelId,
    staleTime: 1000 * 60,
  })

  const joinMutation = useMutation({
    mutationFn: channelApi.joinChannel,
    onSuccess: (data) => {
      toast.success(`Joined #${data.channel_name || "DevSpace"}`)
      queryClient.invalidateQueries({ queryKey: ["channels"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const leaveMutation = useMutation({
    mutationFn: channelApi.leaveChannel,
    onSuccess: (data) => {
      toast.success("Left the channel")
      queryClient.invalidateQueries({ queryKey: ["channels"] })
      queryClient.invalidateQueries({ queryKey: ["channel", data.id] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const createMutation = useMutation({
    mutationFn: channelApi.createChannel,
    onSuccess: () => {
      toast.success("Channel created")
      queryClient.invalidateQueries({ queryKey: ["channels"] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const changeTypeMutation = useMutation({
    mutationFn: async (payload: { id: string; access_type: string }) =>
      channelApi.changeChannelType(payload.id, payload.access_type),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["channel", channelId] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (err: Error) => toast.error(err.message)
  });

  const changeNameMutation = useMutation({
    mutationFn: async (payload: { id: string, name: string }) =>
      channelApi.changeChannelName(payload.id, payload.name),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["channel", channelId] });
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
    onError: (err: Error) => toast.error(err.message)
  })

  const channelActionsLoading =
    joinMutation.isPending ||
    leaveMutation.isPending ||
    createMutation.isPending

  return {
    channels,
    channel,
    refreshChannels,

    channelsLoading,
    channelLoading,
    channelActionsLoading,
    changeTypeLoading: changeTypeMutation.isPending,
    changeNameLoading: changeNameMutation.isPending,

    joinChannel: joinMutation.mutateAsync,
    leaveChannel: leaveMutation.mutateAsync,
    createChannel: createMutation.mutateAsync,
    changeType: (id: string, access_type: string) => changeTypeMutation.mutate({ id, access_type }),
    changeName: (id: string, name: string) => changeNameMutation.mutate({ id, name }),
  }
}
