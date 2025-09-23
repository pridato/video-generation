/**
 * General utility functions
 */
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind CSS class utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// Sleep utility
export const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms))

// Copy to clipboard
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      return successful
    }
  } catch {
    return false
  }
}

// Download file utility
export const downloadFile = (data: Blob | string, filename: string, mimeType?: string) => {
  const blob = typeof data === 'string'
    ? new Blob([data], { type: mimeType || 'text/plain' })
    : data

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Generate random ID
export const generateId = (length = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Array utilities
export const arrayUtils = {
  // Remove duplicates from array
  unique: <T>(array: T[]): T[] => [...new Set(array)],

  // Group array by key
  groupBy: <T, K extends keyof T>(array: T[], key: K): Record<string, T[]> => {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key])
      groups[groupKey] = groups[groupKey] || []
      groups[groupKey].push(item)
      return groups
    }, {} as Record<string, T[]>)
  },

  // Shuffle array
  shuffle: <T>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  },

  // Chunk array into smaller arrays
  chunk: <T>(array: T[], size: number): T[][] => {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  },

  // Find item by property
  findBy: <T, K extends keyof T>(array: T[], key: K, value: T[K]): T | undefined => {
    return array.find(item => item[key] === value)
  }
}

// Object utilities
export const objectUtils = {
  // Deep clone object
  deepClone: <T>(obj: T): T => {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
    if (obj instanceof Array) return obj.map(item => objectUtils.deepClone(item)) as unknown as T

    const cloned = {} as T
    Object.keys(obj).forEach(key => {
      cloned[key as keyof T] = objectUtils.deepClone((obj as any)[key])
    })
    return cloned
  },

  // Check if object is empty
  isEmpty: (obj: Record<string, any>): boolean => {
    return Object.keys(obj).length === 0
  },

  // Pick properties from object
  pick: <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const picked = {} as Pick<T, K>
    keys.forEach(key => {
      if (key in obj) {
        picked[key] = obj[key]
      }
    })
    return picked
  },

  // Omit properties from object
  omit: <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const omitted = { ...obj } as any
    keys.forEach(key => {
      delete omitted[key]
    })
    return omitted
  }
}

// URL utilities
export const urlUtils = {
  // Build URL with query parameters
  buildUrl: (base: string, params: Record<string, string | number | boolean>): string => {
    const url = new URL(base, window.location.origin)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })
    return url.toString()
  },

  // Get query parameters
  getParams: (): Record<string, string> => {
    if (typeof window === 'undefined') return {}
    const params = new URLSearchParams(window.location.search)
    const result: Record<string, string> = {}
    params.forEach((value, key) => {
      result[key] = value
    })
    return result
  },

  // Update URL without page reload
  updateUrl: (params: Record<string, string | null>) => {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        url.searchParams.delete(key)
      } else {
        url.searchParams.set(key, value)
      }
    })
    window.history.replaceState({}, '', url.toString())
  }
}

// Browser detection
export const browserUtils = {
  isMobile: (): boolean => {
    if (typeof window === 'undefined') return false
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  },

  isIOS: (): boolean => {
    if (typeof window === 'undefined') return false
    return /iPad|iPhone|iPod/.test(navigator.userAgent)
  },

  isAndroid: (): boolean => {
    if (typeof window === 'undefined') return false
    return /Android/.test(navigator.userAgent)
  },

  isSafari: (): boolean => {
    if (typeof window === 'undefined') return false
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  },

  supportsWebP: (): boolean => {
    if (typeof window === 'undefined') return false
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }
}

// Performance utilities
export const performanceUtils = {
  // Measure function execution time
  measure: async <T>(name: string, fn: () => Promise<T> | T): Promise<T> => {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    console.log(`${name} took ${end - start} milliseconds`)
    return result
  },

  // Create a performance observer
  observePerformance: (callback: (entries: PerformanceEntry[]) => void) => {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return

    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries())
    })

    observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] })
    return () => observer.disconnect()
  }
}
