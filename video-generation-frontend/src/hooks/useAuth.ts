/**
 * Authentication hook
 */
import { useState, useEffect } from 'react'
import { authService } from '@/services/auth'
import { sessionManager } from '@/lib/auth'
import type { LoginCredentials, RegisterData, AuthResponse } from '@/services/auth'

interface AuthState {
  user: AuthResponse['user'] | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  })

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = () => {
    try {
      const isAuthenticated = authService.isAuthenticated()
      const user = authService.getCurrentUser()

      setState({
        user,
        isAuthenticated,
        isLoading: false,
        error: null
      })
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error de autenticación'
      })
    }
  }

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await authService.login(credentials)

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      throw error
    }
  }

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await authService.register(data)

      setState({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      })

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al registrarse'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      throw error
    }
  }

  const logout = async (): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      await authService.logout()

      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    } catch (error) {
      // Even if logout fails on server, clear local state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      })
    }
  }

  const refreshToken = async (): Promise<void> => {
    try {
      await authService.refreshToken()
      checkAuthStatus()
    } catch (error) {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Sesión expirada'
      })
    }
  }

  const forgotPassword = async (email: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      await authService.forgotPassword(email)
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al enviar email'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      throw error
    }
  }

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      await authService.resetPassword(token, newPassword)
      setState(prev => ({ ...prev, isLoading: false }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al restablecer contraseña'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
      throw error
    }
  }

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }))
  }

  return {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    forgotPassword,
    resetPassword,
    clearError,
    checkAuthStatus
  }
}