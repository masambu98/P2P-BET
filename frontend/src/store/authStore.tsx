import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../types/auth'
import { authService } from '../services/auth'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  clearError: () => void
  setTokens: (token: string, refreshToken: string) => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    {
      name: 'user-storage',
      storage: createJSONStorage()
    },
    {
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,
    },
    {
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.login(credentials)
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isLoading: false,
            error: null
          })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error || 'Login failed'
          })
          throw error
        }
      },
      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await authService.register(data)
          set({
            user: response.user,
            token: response.token,
            refreshToken: response.refreshToken,
            isLoading: false,
            error: null
          })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error || 'Registration failed'
          })
          throw error
        }
      },
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          error: null
        })
      },
      clearError: () => {
        set({ error: null })
      },
      setTokens: (token: string, refreshToken: string) => {
        set({
          user: null,
          token: null,
          refreshToken: null
        })
      },
      checkAuth: () => {
        const user = JSON.parse(localStorage.getItem('user-storage'))
        const token = localStorage.getItem('token')
        const refreshToken = localStorage.getItem('refreshToken')
        
        if (user && token) {
          set({
            user: JSON.parse(user),
            token,
            refreshToken,
            isLoading: false,
            error: null
          })
        } else {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isLoading: false,
            error: null
          })
        }
      }
    }
  }
)
