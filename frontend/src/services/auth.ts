import axios from 'axios'
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-storage')
  if (token) {
    try {
      const authData = JSON.parse(token)
      if (authData.state?.token) {
        config.headers.Authorization = `Bearer ${authData.state.token}`
      }
    } catch (error) {
      console.error('Error parsing auth storage:', error)
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const token = localStorage.getItem('auth-storage')
        if (token) {
          const authData = JSON.parse(token)
          if (authData.state?.refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken: authData.state.refreshToken
            })

            const newToken = response.data.token
            const newRefreshToken = response.data.refreshToken

            localStorage.setItem('auth-storage', JSON.stringify({
              state: {
                ...authData.state,
                token: newToken,
                refreshToken: newRefreshToken
              }
            }))

            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials)
    return response.data
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data)
    return response.data
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh', { refreshToken })
    return response.data
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get('/auth/profile')
    return response.data.user
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  }
}
