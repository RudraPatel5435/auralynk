import { Loader2, Plus, Users, ShieldCheck } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog"
import { DropdownMenuItem } from "../ui/dropdown-menu"
import { useId, useState } from "react"
import { useChannels } from "@/hooks/useChannels"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader } from "../ui/card"
import { cn } from "@/lib/utils"
import { DialogClose } from "@radix-ui/react-dialog"

const JoinChannel = () => {
  const {
    channels,
    joinChannel,
    channelsLoading,
    channelActionsLoading
  } = useChannels()

  const [joinChannelName, setJoinChannelName] = useState("")
  const [joinChannelId, setJoinChannelId] = useState("")

  const handleJoinChannel = async () => {
    if (!joinChannelId) return

    const success = await joinChannel(joinChannelId)
    if (success) {
      setJoinChannelName("")
      setJoinChannelId("")
    }
  }

  const joinableChannels = channels.filter(ch => !ch.is_member)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Plus className="mr-2 h-4 w-4" /> Join DevSpace
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="w-[800px] max-w-[90vw] h-[600px] max-h-[90vh] rounded-2xl p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-2xl font-semibold">Join a DevSpace</DialogTitle>
          <DialogDescription className="text-base">
            Explore public DevSpaces and pick one to join
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 h-full mt-2">

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto pr-2">

            {/* 🔄 LOADING SKELETON STATE */}
            {channelsLoading &&
              Array.from({ length: 6 }).map((_) => (
                <Card
                  key={useId()}
                  className="rounded-xl border p-4 animate-pulse bg-accent/30"
                >
                  <div className="h-5 w-1/2 bg-muted rounded mb-3" />
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 bg-muted rounded" />
                    <div className="h-3 w-1/2 bg-muted rounded" />
                    <div className="h-3 w-1/3 bg-muted rounded" />
                  </div>
                </Card>
              ))
            }

            {/* 😴 EMPTY STATE */}
            {!channelsLoading && joinableChannels.length === 0 && (
              <div className="flex flex-col items-center justify-center text-center col-span-full py-16 opacity-70">
                <ShieldCheck className="h-12 w-12 text-muted-foreground mb-3" />
                <h2 className="text-lg font-semibold">No DevSpaces Available</h2>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Looks like you've already joined all available DevSpaces — or none are open to join right now.
                </p>
              </div>
            )}

            {/* 🟢 JOINABLE CHANNELS LIST */}
            {!channelsLoading &&
              joinableChannels.length > 0 &&
              joinableChannels.map((ch) => (
                <Card
                  key={ch.id}
                  onClick={() => {
                    if (ch.id !== joinChannelId || ch.name !== joinChannelName) {
                      setJoinChannelName(ch.name)
                      setJoinChannelId(ch.id)
                    } else {
                      setJoinChannelName("")
                      setJoinChannelId("")
                    }
                  }}
                  className={cn(
                    "cursor-pointer rounded-xl border transition-all duration-150 shadow-sm hover:shadow-md hover:bg-accent/40",
                    joinChannelId === ch.id && "bg-primary/30 shadow-md"
                  )}
                >
                  <CardHeader className="pb-1 text-lg font-semibold">
                    #{ch.name}
                  </CardHeader>

                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span>
                        <span className="font-medium">Admin:</span> {ch.admin.username}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary" />
                      <span>
                        <span className="font-medium">Members:</span> {ch.member_count}
                      </span>
                    </div>

                    <p className="text-xs">
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(ch.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            }

          </div>

          {/* FOOTER BUTTON */}
          <DialogClose>
            <Button
              onClick={handleJoinChannel}
              disabled={!joinChannelId || channelActionsLoading}
              className="w-full h-11 text-md rounded-xl"
            >
              {channelActionsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                `Join #${joinChannelName || "DevSpace"}`
              )}
            </Button>
          </DialogClose>

        </div>
      </DialogContent>
    </Dialog>
  )
}

export default JoinChannel
