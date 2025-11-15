import { createFileRoute } from '@tanstack/react-router'
import { Hash } from 'lucide-react'

export const Route = createFileRoute('/(channels)/channels/@dev')({
  component: RouteComponent
})

function RouteComponent() {
  return (

    <div className="flex-1 flex flex-col">
      <div className="h-12 px-4 flex items-center border-b border-border bg-[hsl(var(--color-bg-secondary))]">
        <Hash className="h-5 w-5 text-muted-foreground mr-2" />
        <span className="font-semibold">Ay Dev!</span>
      </div>
    </div>
  )
}

