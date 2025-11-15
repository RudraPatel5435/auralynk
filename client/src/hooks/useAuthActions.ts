import { useAuthStore } from "@/store/useAuthStore"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export const useAuthActions = () => {

  const navigate = useNavigate()
  const { setUser, setAuthLoading, setIsAuthenticated } = useAuthStore()

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

      if (!response.ok || !data.success) throw new Error(data.message || "Registration failed")

      const reqData = data.data
      setUser(reqData.user)
      setIsAuthenticated(true)
      toast.info("Account created succesfully!")
      navigate({ to: "/channels/@dev" })
    } catch (err: any) {
      console.error("Failed to register:", err)
      toast.error(`${err}` || "Failed to register")
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

      if (!response.ok || !data.success) throw new Error(data.message || "Login failed")

      const reqData = data.data
      setIsAuthenticated(true)
      setUser(reqData.user)
      toast.success("Welcome back!")
      navigate({ to: '/channels/@dev' })
    } catch (err: any) {
      console.error("Failed to login:", err)
      toast.error(`${err}` || "Failed to login")
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

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Logout failed")
      }
      setUser(null)
      setIsAuthenticated(false)
      toast.info("Logged Out succesfully")
      navigate({ to: "/login" })
    } catch (err: any) {
      console.error("Failed to logout:", err)
      toast.error(`${err}` || "Failed to logout")
    } finally {
      setAuthLoading(false)
    }
  }

  return { register, login, logout }
}
