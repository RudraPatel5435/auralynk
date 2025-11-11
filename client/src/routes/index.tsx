import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/useAuthStore'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { user, token, logout } = useAuthStore()
  return (
    <div>
      Hello
      <Button variant='destructive' onClick={logout}>
        Logout
      </Button>
      {`User: ${user}`}
      Token: {token}
    </div>
  )
}
