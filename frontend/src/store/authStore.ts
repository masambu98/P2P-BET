import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthResponse, LoginRequest, RegisterRequest } from '../types/auth'
import { authService } from '../services/auth'
import { socketService } from '../services/socketService'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isLoading: boolean
  error: string | null
  hasHydrated: boolean
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>
  register: (data: RegisterRequest) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  clearError: () => void
  setTokens: (token: string, refreshToken: string) => void
  setHasHydrated: (hydrated: boolean) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,
      hasHydrated: false,

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
          // Connect Socket.io after successful login
          socketService.connect(response.token)
          socketService.joinUserRoom(response.user.id)
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
          // Connect Socket.io after successful registration
          socketService.connect(response.token)
          socketService.joinUserRoom(response.user.id)
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.error || 'Registration failed'
          })
          throw error
        }
      },

      logout: () => {
        const { user } = get()
        // Disconnect Socket.io before logout
        if (user) {
          socketService.leaveUserRoom(user.id)
        }
        socketService.disconnect()
        set({
          user: null,
          token: null,
          refreshToken: null,
          error: null
        })
      },

      checkAuth: async () => {
        const { token, refreshToken } = get()
        if (!token || !refreshToken) {
          return
        }

        set({ isLoading: true })
        try {
          // First verify the existing token with profile endpoint
          const response = await fetch('/api/auth/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.status === 401) {
            // Token is invalid, try refresh
            try {
              const refreshResponse = await authService.refreshToken(refreshToken)
              set({
                user: refreshResponse.user,
                token: refreshResponse.token,
                refreshToken: refreshResponse.refreshToken,
                isLoading: false,
                error: null
              })
            } catch (refreshError) {
              // Refresh failed, clear everything and logout
              localStorage.removeItem('auth-storage')
              set({
                user: null,
                token: null,
                refreshToken: null,
                isLoading: false,
                error: null
              })
            }
            return
          }

          if (!response.ok) {
            throw new Error('Profile check failed')
          }

          const user = await response.json()
          set({
            user,
            isLoading: false,
            error: null
          })
        } catch (error: any) {
          // Any error, clear auth and logout
          localStorage.removeItem('auth-storage')
          set({
            user: null,
            token: null,
            refreshToken: null,
            isLoading: false,
            error: null
          })
        }
      },

      clearError: () => set({ error: null }),

      setTokens: (token: string, refreshToken: string) => {
        set({ token, refreshToken })
      },

      setHasHydrated: (hydrated: boolean) => {
        set({ hasHydrated: hydrated })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
