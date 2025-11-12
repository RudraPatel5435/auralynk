import { useAuth } from "@/hooks/useAuth"
import { useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, authLoading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate({ to: '/login' })
    }
  }, [isAuthenticated, authLoading, navigate])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
