/**
 * Generic API hook for handling async operations
 */
import { useState, useCallback } from 'react'

interface ApiState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  initialData?: any
}

export const useApi = <T = any>(options?: UseApiOptions) => {
  const [state, setState] = useState<ApiState<T>>({
    data: options?.initialData || null,
    isLoading: false,
    error: null
  })

  const execute = useCallback(async (apiCall: () => Promise<T>): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await apiCall()

      setState({
        data: result,
        isLoading: false,
        error: null
      })

      options?.onSuccess?.(result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en la operación'

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))

      options?.onError?.(error as Error)
      return null
    }
  }, [options])

  const reset = useCallback(() => {
    setState({
      data: options?.initialData || null,
      isLoading: false,
      error: null
    })
  }, [options?.initialData])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }))
  }, [])

  return {
    ...state,
    execute,
    reset,
    clearError,
    setData
  }
}

/**
 * Hook for handling paginated API calls
 */
interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  hasMore: boolean
}

interface UsePaginatedApiOptions<T> extends UseApiOptions {
  pageSize?: number
  initialPage?: number
}

export const usePaginatedApi = <T = any>(options?: UsePaginatedApiOptions<T>) => {
  const [state, setState] = useState({
    items: [] as T[],
    total: 0,
    page: options?.initialPage || 1,
    hasMore: false,
    isLoading: false,
    error: null as string | null
  })

  const execute = useCallback(async (
    apiCall: (page: number, pageSize: number) => Promise<PaginatedResult<T>>,
    page = 1,
    append = false
  ): Promise<PaginatedResult<T> | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const result = await apiCall(page, options?.pageSize || 20)

      setState(prev => ({
        items: append ? [...prev.items, ...result.items] : result.items,
        total: result.total,
        page: result.page,
        hasMore: result.hasMore,
        isLoading: false,
        error: null
      }))

      options?.onSuccess?.(result)
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en la operación'

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))

      options?.onError?.(error as Error)
      return null
    }
  }, [options])

  const loadMore = useCallback((apiCall: (page: number, pageSize: number) => Promise<PaginatedResult<T>>) => {
    if (state.hasMore && !state.isLoading) {
      return execute(apiCall, state.page + 1, true)
    }
    return Promise.resolve(null)
  }, [state.hasMore, state.isLoading, state.page, execute])

  const refresh = useCallback((apiCall: (page: number, pageSize: number) => Promise<PaginatedResult<T>>) => {
    return execute(apiCall, 1, false)
  }, [execute])

  const reset = useCallback(() => {
    setState({
      items: [],
      total: 0,
      page: options?.initialPage || 1,
      hasMore: false,
      isLoading: false,
      error: null
    })
  }, [options?.initialPage])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    execute,
    loadMore,
    refresh,
    reset,
    clearError
  }
}