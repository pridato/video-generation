/**
 * Authentication service
 */
import { apiClient, ApiError } from '@/lib/api'
import { tokenManager, sessionManager } from '@/lib/auth'
import { API_ENDPOINTS } from '@/constants'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    email: string
    name: string
    subscriptionTier: string
  }
}

export interface RefreshTokenResponse {
  token: string
  refreshToken: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      )

      tokenManager.set(response.token)
      sessionManager.setUserData(response.user)

      return response
    } catch (error) {
      throw new ApiError(
        error instanceof ApiError ? error.message : 'Error al iniciar sesión',
        error instanceof ApiError ? error.status : 500
      )
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        data
      )

      tokenManager.set(response.token)
      sessionManager.setUserData(response.user)

      return response
    } catch (error) {
      throw new ApiError(
        error instanceof ApiError ? error.message : 'Error al registrarse',
        error instanceof ApiError ? error.status : 500
      )
    }
  },

  async logout(): Promise<void> {
    try {
      const token = tokenManager.get()
      if (token) {
        await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT, {}, {
          Authorization: `Bearer ${token}`
        })
      }
    } catch (error) {
      console.warn('Error durante logout:', error)
    } finally {
      sessionManager.clear()
    }
  },

  async refreshToken(): Promise<RefreshTokenResponse> {
    const token = tokenManager.get()
    if (!token) {
      throw new ApiError('No hay token disponible', 401)
    }

    try {
      const response = await apiClient.post<RefreshTokenResponse>(
        API_ENDPOINTS.AUTH.REFRESH,
        {},
        { Authorization: `Bearer ${token}` }
      )

      tokenManager.set(response.token)
      return response
    } catch (error) {
      sessionManager.clear()
      throw new ApiError(
        error instanceof ApiError ? error.message : 'Error al renovar token',
        error instanceof ApiError ? error.status : 401
      )
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    try {
      return await apiClient.post<{ message: string }>(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
        { email }
      )
    } catch (error) {
      throw new ApiError(
        error instanceof ApiError ? error.message : 'Error al enviar email de recuperación',
        error instanceof ApiError ? error.status : 500
      )
    }
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      return await apiClient.post<{ message: string }>(
        API_ENDPOINTS.AUTH.RESET_PASSWORD,
        { token, password: newPassword }
      )
    } catch (error) {
      throw new ApiError(
        error instanceof ApiError ? error.message : 'Error al restablecer contraseña',
        error instanceof ApiError ? error.status : 500
      )
    }
  },

  getCurrentUser() {
    return sessionManager.getUserData()
  },

  isAuthenticated(): boolean {
    return sessionManager.isValid()
  },

  getToken(): string | null {
    return tokenManager.get()
  }
}