import { create } from 'zustand'

interface User {
  id: string
  username: string
  email: string
}

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  user: User | null;
  setUser: (user: User) => void;
  authLoading: boolean;
  setAuthLoading: (authLoading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  token: null,
  setToken: (token) => set({ token }),
  user: null,
  setUser: (user) => set({ user }),
  authLoading: false,
  setAuthLoading: (authLoading) => set({ authLoading }),
  logout: () => {
    set({ token: null, user: null })
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
  }
})) 
