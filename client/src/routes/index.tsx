import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { useAuthActions } from '@/hooks/useAuthActions'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { user } = useAuth()
  const { logout } = useAuthActions()
  return (
    <div>
      Hello
      <Button variant='destructive' onClick={logout}>
        Logout
      </Button>
      {user &&
        <div className='flex flex-col gap-2'>
          ID: {user.id}
          username: {user.username}
          email: {user.email}
        </div>
      }
    </div>
  )
}
