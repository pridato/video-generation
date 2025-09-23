/**
 * Authentication utilities
 */
import { AUTH_REDIRECTS, SESSION_CONFIG } from '@/constants'

// Token management
export const tokenManager = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  },

  set: (token: string): void => {
    if (typeof window === 'undefined') return
    localStorage.setItem('auth_token', token)
  },

  remove: (): void => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('auth_token')
  },

  isExpired: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      return payload.exp < currentTime
    } catch {
      return true
    }
  },

  shouldRefresh: (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Math.floor(Date.now() / 1000)
      const timeUntilExpiry = payload.exp - currentTime
      return timeUntilExpiry < SESSION_CONFIG.REFRESH_THRESHOLD
    } catch {
      return false
    }
  }
}

// Session management
export const sessionManager = {
  isValid: (): boolean => {
    const token = tokenManager.get()
    return token !== null && !tokenManager.isExpired(token)
  },

  clear: (): void => {
    tokenManager.remove()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_data')
      localStorage.removeItem('refresh_token')
    }
  },

  getUserData: () => {
    if (typeof window === 'undefined') return null
    const userData = localStorage.getItem('user_data')
    return userData ? JSON.parse(userData) : null
  },

  setUserData: (data: any) => {
    if (typeof window === 'undefined') return
    localStorage.setItem('user_data', JSON.stringify(data))
  }
}

// Route protection utilities
export const routeGuards = {
  requireAuth: (currentPath: string): string | null => {
    if (!sessionManager.isValid()) {
      return `${AUTH_REDIRECTS.LOGIN_REQUIRED}?redirect=${encodeURIComponent(currentPath)}`
    }
    return null
  },

  requireGuest: (): string | null => {
    if (sessionManager.isValid()) {
      return AUTH_REDIRECTS.AFTER_LOGIN
    }
    return null
  },

  getRedirectAfterLogin: (): string => {
    if (typeof window === 'undefined') return AUTH_REDIRECTS.AFTER_LOGIN

    const urlParams = new URLSearchParams(window.location.search)
    const redirect = urlParams.get('redirect')

    // Validate redirect URL to prevent open redirects
    if (redirect && isValidRedirect(redirect)) {
      return redirect
    }

    return AUTH_REDIRECTS.AFTER_LOGIN
  }
}

// Password utilities
export const passwordUtils = {
  generate: (length = 12): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''

    // Ensure at least one character from each required type
    const required = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      '!@#$%^&*'
    ]

    required.forEach(chars => {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    })

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  },

  hash: async (password: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
}

// OAuth utilities
export const oauthUtils = {
  buildAuthUrl: (provider: string, redirectUri: string, state?: string): string => {
    const params = new URLSearchParams({
      redirect_uri: redirectUri,
      ...(state && { state })
    })

    return `/auth/${provider}?${params.toString()}`
  },

  parseCallback: (): { code?: string; state?: string; error?: string } => {
    if (typeof window === 'undefined') return {}

    const urlParams = new URLSearchParams(window.location.search)
    return {
      code: urlParams.get('code') || undefined,
      state: urlParams.get('state') || undefined,
      error: urlParams.get('error') || undefined
    }
  }
}

// Remember me functionality
export const rememberMe = {
  set: (token: string): void => {
    if (typeof window === 'undefined') return
    const expiryDate = new Date()
    expiryDate.setTime(expiryDate.getTime() + SESSION_CONFIG.REMEMBER_ME_DURATION * 1000)

    document.cookie = `remember_token=${token}; expires=${expiryDate.toUTCString()}; path=/; secure; samesite=strict`
  },

  get: (): string | null => {
    if (typeof window === 'undefined') return null

    const cookies = document.cookie.split(';')
    const rememberCookie = cookies.find(cookie => cookie.trim().startsWith('remember_token='))

    return rememberCookie ? rememberCookie.split('=')[1] : null
  },

  clear: (): void => {
    if (typeof window === 'undefined') return
    document.cookie = 'remember_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
  }
}

// Helper functions
const isValidRedirect = (url: string): boolean => {
  try {
    const parsed = new URL(url, window.location.origin)
    return parsed.origin === window.location.origin
  } catch {
    return false
  }
}

// Device fingerprinting for security
export const deviceFingerprint = {
  generate: (): string => {
    if (typeof window === 'undefined') return 'server'

    const components = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
    ]

    return btoa(components.join('|')).slice(0, 16)
  }
}

// Security headers
export const securityHeaders = {
  getAuthHeaders: (token: string) => ({
    'Authorization': `Bearer ${token}`,
    'X-Device-Fingerprint': deviceFingerprint.generate(),
  })
}