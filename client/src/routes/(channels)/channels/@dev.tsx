import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useChannels } from '@/hooks/useChannels'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(channels)/channels/@dev')({
  component: RouteComponent,
})

function RouteComponent() {
  const { channels, channelsLoading } = useChannels()

  if (channelsLoading) return <p>Loading channels...</p>

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Available Channels</h2>
      <ul className="space-y-2">
        {!channels.length ? (
          <div>
            <p>No channels found.</p>
            <Dialog>
              <DialogTrigger>Create Channel</DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you absolutely sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          channels.map((ch) => (
            <li
              key={ch.id}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              <span className="font-medium">{ch.name}</span>
              <span className="ml-2 text-sm text-gray-600">
                ({ch.access_type})
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
