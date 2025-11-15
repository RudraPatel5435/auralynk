import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from "../ui/button"
import { Loader2, Plus } from "lucide-react"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { useState } from "react"
import { useChannels } from "@/hooks/useChannels"

const CreateChannel = () => {
  const { createChannel, channelActionsLoading } = useChannels()
  const [channelName, setChannelName] = useState("")
  const [accessType, setAccessType] = useState("public")

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 m-2">
          <Plus className="h-4 w-4" />
          Create Channel
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={(e) => {
          e.preventDefault()
          createChannel({ name: channelName, access_type: accessType })
        }}
          className="space-y-6">
          <DialogHeader>
            <DialogTitle className="text-primary">Create New Channel</DialogTitle>
            <DialogDescription>
              Enter details for your new channel below.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {/* Channel Name */}
            <div className="grid gap-2">
              <Label htmlFor="channel-name" className="text-primary">Channel Name</Label>
              <Input
                id="channel-name"
                placeholder="e.g. general"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                required
              />
            </div>

            {/* Access Type */}
            <div className="grid gap-2">
              <Label className="text-primary">Access Type</Label>
              <RadioGroup
                defaultValue="public"
                value={accessType}
                onValueChange={setAccessType}
                className="flex items-center gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="public" />
                  <Label htmlFor="public">Public</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="private" />
                  <Label htmlFor="private">Private</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={channelActionsLoading}
            >
              {channelActionsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default CreateChannel
