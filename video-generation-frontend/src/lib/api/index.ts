/**
 * API client utilities
 */
import { API_CONFIG, API_ENDPOINTS, HTTP_STATUS, HEADERS } from '@/constants'

// Base API client configuration
export class ApiClient {
  private baseUrl: string
  private timeout: number

  constructor(baseUrl = API_CONFIG.BASE_URL, timeout = API_CONFIG.TIMEOUT) {
    this.baseUrl = baseUrl
    this.timeout = timeout
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      ...options,
      headers: {
        [HEADERS.CONTENT_TYPE.JSON]: HEADERS.ACCEPT,
        ...options.headers,
      },
    }

    // Add timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw await this.handleError(response)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers })
  }

  async post<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    })
  }

  async put<T>(
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers })
  }

  // Handle API errors
  private async handleError(response: Response): Promise<Error> {
    let errorMessage = 'An error occurred'

    try {
      const errorData = await response.json()
      errorMessage = errorData.message || errorData.error || errorMessage
    } catch {
      errorMessage = response.statusText || errorMessage
    }

    return new ApiError(errorMessage, response.status)
  }
}

// Custom API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isNetworkError(): boolean {
    return this.status === 0
  }

  get isServerError(): boolean {
    return this.status >= 500
  }

  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500
  }

  get isUnauthorized(): boolean {
    return this.status === HTTP_STATUS.UNAUTHORIZED
  }

  get isForbidden(): boolean {
    return this.status === HTTP_STATUS.FORBIDDEN
  }

  get isNotFound(): boolean {
    return this.status === HTTP_STATUS.NOT_FOUND
  }

  get isRateLimited(): boolean {
    return this.status === HTTP_STATUS.TOO_MANY_REQUESTS
  }
}

// Create default API client instance
export const apiClient = new ApiClient()

// Utility functions for common API patterns
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        throw lastError
      }

      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.isClientError) {
        throw error
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError!
}

export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
  )

  return Promise.race([promise, timeout])
}

// Request interceptor utilities
export const createAuthHeaders = (token: string): Record<string, string> => ({
  [HEADERS.AUTHORIZATION]: `Bearer ${token}`,
})

export const createFormDataHeaders = (): Record<string, string> => ({
  // Don't set Content-Type for FormData, let browser set it with boundary
})

// Response helpers
export const isSuccessResponse = (status: number): boolean =>
  status >= 200 && status < 300

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}