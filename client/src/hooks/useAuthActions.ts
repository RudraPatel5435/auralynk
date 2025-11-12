
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/store/useAuthStore"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const useAuthActions = () => {

  const navigate = useNavigate()
  const { setUser, setAuthLoading } = useAuthStore()
  const { refreshUser } = useAuth()

  const register = async (username: string, email: string, password: string) => {
    setAuthLoading(true)
    try {
      const response = await fetch(`${API_URL}/user/register`, {
        method: "POST",
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Registration failed")
      }

      const reqData = data.data
      setUser(reqData.user)
      navigate({ to: "/channels/@dev" })
    } catch (err: any) {
      console.error("Failed to register:", err)
      toast.error(`${err}`)
    } finally {
      setAuthLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setAuthLoading(true)
    try {
      const response = await fetch(`${API_URL}/user/login`, {
        method: "POST",
        credentials: "include",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Login failed")
      }

      const reqData = data.data
      setUser(reqData.user)
      navigate({ to: '/channels/@dev' })
    } catch (err: any) {
      console.error("Failed to login:", err)
      toast.error(`${err}`)
    } finally {
      setAuthLoading(false)
    }
  }

  const logout = async () => {
    setAuthLoading(true)
    try {
      const response = await fetch(`${API_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || "Logout failed")
      }
      refreshUser()

    } catch (err: any) {
      console.error("Failed to logout:", err)
      toast.error(`${err}`)
    } finally {
      setAuthLoading(false)
    }
  }

  return { register, login, logout }
}
