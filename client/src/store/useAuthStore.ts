import { create } from 'zustand'

interface User {
  id: string
  username: string
  email: string
}

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  authLoading: boolean;
  setAuthLoading: (authLoading: boolean) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
}

export const useAuthStore = create<AuthState>(set => ({
  user: null,
  setUser: (user) => set({ user }),
  authLoading: false,
  setAuthLoading: (authLoading) => set({ authLoading }),
  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated })
})) 
