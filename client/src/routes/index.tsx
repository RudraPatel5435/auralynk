import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { user } = useAuth()
  const logout = async () => {
    await fetch('http://localhost:8080/user/logout')
  }
  return (
    <div>
      Hello
      <Button variant='destructive' onClick={logout}>
        Logout
      </Button>
      {`User: ${user}`}
    </div>
  )
}
