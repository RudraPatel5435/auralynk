import { Button } from '@/components/ui/button'
import { useCurrentUser, useLogout } from '@/hooks/useAuth'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const { data: user } = useCurrentUser()
  const logout = useLogout()
  return (
    <div>
      Hello
      <Button variant='destructive' onClick={() => logout.mutateAsync()}>
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
