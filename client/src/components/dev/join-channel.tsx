import { Loader2, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog"
import { DropdownMenuItem } from "../ui/dropdown-menu"
import { useState } from "react"
import { useChannels } from "@/hooks/useChannels"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader } from "../ui/card"
import { cn } from "@/lib/utils"

const JoinChannel = () => {
  const { channels, joinChannel } = useChannels()
  const [isJoining, setIsJoining] = useState(false)
  const [joinChannelName, setJoinChannelName] = useState('')
  const [joinChannelId, setJoinChannelId] = useState('')

  const handleJoinChannel = async () => {
    setIsJoining(true)
    const success = await joinChannel(joinChannelId)
    if (success) setJoinChannelName(''); setJoinChannelId('')
    setIsJoining(false)
  }

  const joinableChannels = channels.filter(ch => !ch.is_member)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={e => e.preventDefault()}>
          <Plus className="mr-2 h-4 w-4" /> Join Channel
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="w-5/6 h-4/5 rounded-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-semibold">Join a DevSpace</DialogTitle>
          <DialogDescription>
            Choose a DevSpace you want to join
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-full w-full mt-2">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-1">
            {joinableChannels.map((ch, idx) => (
              <Card
                key={idx}
                onClick={() => {
                  setJoinChannelName(ch.name)
                  setJoinChannelId(ch.id)
                }}

                className={cn(
                  "cursor-pointer rounded-xl border hover:bg-accent transition-all duration-150",
                  joinChannelName === ch.name && "border-primary bg-primary/5"
                )}
              >
                <CardHeader className="pb-1 text-base font-semibold">
                  #{ch.name}
                </CardHeader>

                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p><span className="font-medium">Admin:</span> {ch.admin_username}</p>
                  <p><span className="font-medium">Members:</span> {ch.member_count}</p>
                  <p className="text-xs"><span className="font-medium">Created:</span> {new Date(ch.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            onClick={handleJoinChannel}
            disabled={!joinChannelId.trim() || isJoining}
            className="w-full h-10 mt-4"
          >
            {isJoining ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Join #${joinChannelName || "DevSpace"}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog >
  )
}

export default JoinChannel
