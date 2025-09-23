/**
 * Debounce hook for optimizing frequent updates
 */
import { useState, useEffect } from 'react'

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Debounced callback hook
 */
import { useCallback, useRef } from 'react'

export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  )

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const flush = useCallback(
    (...args: Parameters<T>) => {
      cancel()
      callback(...args)
    },
    [callback, cancel]
  )

  return {
    callback: debouncedCallback,
    cancel,
    flush
  }
}

/**
 * Hook for debounced search functionality
 */
export const useDebouncedSearch = (
  searchFunction: (query: string) => Promise<any>,
  delay = 300
) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, delay)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setError(null)
      return
    }

    const search = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const searchResults = await searchFunction(debouncedQuery)
        setResults(searchResults)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error en la búsqueda')
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    search()
  }, [debouncedQuery, searchFunction])

  const clearResults = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearResults
  }
}