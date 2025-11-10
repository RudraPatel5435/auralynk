import { useEffect, useState } from "react"

interface User {
  id: string
  username: string
  email: string
}

const API_URL = process.env.API_URL || "http://localhost:8080/api"

export default function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token')
    const storedUser = localStorage.getItem('auth_user')

    if (storedUser && storedToken) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  })

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/user/login`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || "Login failed")
    }

    const reqData = data.data
    setToken(reqData.token)
    setUser(reqData.user)
    localStorage.setItem('auth_token', reqData.token)
    localStorage.setItem('auth_user', JSON.stringify(reqData.token))
  }

  const register = async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_URL}/user/register`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    })

    const data = await response.json()

    if (!data.success) {
      throw new Error(data.message || "Registration failed")
    }

    const reqData = data.data
    setToken(reqData.token)
    setUser(reqData.user)
    localStorage.setItem('auth_token', reqData.token)
    localStorage.setItem('auth_user', JSON.stringify(reqData.token))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
  }

  return {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  }
}
