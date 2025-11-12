import { useAuthStore } from "@/store/useAuthStore"
import { useEffect } from "react"
import { toast } from "sonner"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const useAuth = () => {

  const { user, setUser, authLoading, setAuthLoading, isAuthenticated, setIsAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated || !authLoading) getMe()
  }, [])

  const getMe = async () => {
    setAuthLoading(true)
    try {
      const res = await fetch(`${API_URL}/user/me`, {
        method: "GET",
        credentials: "include",
      })
      if (!res.ok) throw new Error("Unauthorized or session expired")
      const data = await res.json()
      setUser(data.data || data)
      setIsAuthenticated(true)
    } catch (err) {
      console.error(err)
      toast.error(`${err}`)
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setAuthLoading(false)
    }
  }

  return {
    user,
    isAuthenticated,
    authLoading,
    refreshUser: getMe,
  }
}
