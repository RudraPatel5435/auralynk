import { useAuthStore } from "@/store/useAuthStore"
import { useEffect } from "react"
import { toast } from "sonner"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const useAuth = () => {

  const { user, setUser, authLoading, setAuthLoading, isAuthenticated, setIsAuthenticated } = useAuthStore()

  const getMe = async () => {
    setAuthLoading(true)
    try {
      const res = await fetch(`${API_URL}/user/me`, {
        method: "GET"
      })
      if (!res.ok) throw new Error("Failed to get user details")
      const data = await res.json()
      setUser(data)
      setIsAuthenticated(true)
    } catch (err) {
      toast.error(`${err}`)
      console.error(err)
      setIsAuthenticated(false)
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) getMe()
  }, [isAuthenticated])

  return { user, isAuthenticated, authLoading }
}
