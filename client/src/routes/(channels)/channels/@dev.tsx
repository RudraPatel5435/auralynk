import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(channels)/channels/@dev')({
  component: RouteComponent
})

function RouteComponent() {
  return (<div>Hello dev</div>)
}
