/**
 * Local storage utilities
 */
import { STORAGE_KEYS } from '@/constants'

// Type-safe localStorage wrapper
class LocalStorageManager {
  // Generic get method
  get<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return defaultValue || null

    try {
      const item = localStorage.getItem(key)
      if (item === null) return defaultValue || null

      return JSON.parse(item)
    } catch (error) {
      console.warn(`Error reading from localStorage key "${key}":`, error)
      return defaultValue || null
    }
  }

  // Generic set method
  set<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false

    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn(`Error writing to localStorage key "${key}":`, error)
      return false
    }
  }

  // Remove item
  remove(key: string): boolean {
    if (typeof window === 'undefined') return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
      return false
    }
  }

  // Clear all localStorage
  clear(): boolean {
    if (typeof window === 'undefined') return false

    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.warn('Error clearing localStorage:', error)
      return false
    }
  }

  // Check if key exists
  has(key: string): boolean {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(key) !== null
  }

  // Get all keys
  keys(): string[] {
    if (typeof window === 'undefined') return []
    return Object.keys(localStorage)
  }

  // Get storage size in bytes (approximate)
  size(): number {
    if (typeof window === 'undefined') return 0

    let total = 0
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    return total
  }
}

// SessionStorage wrapper
class SessionStorageManager {
  get<T>(key: string, defaultValue?: T): T | null {
    if (typeof window === 'undefined') return defaultValue || null

    try {
      const item = sessionStorage.getItem(key)
      if (item === null) return defaultValue || null

      return JSON.parse(item)
    } catch (error) {
      console.warn(`Error reading from sessionStorage key "${key}":`, error)
      return defaultValue || null
    }
  }

  set<T>(key: string, value: T): boolean {
    if (typeof window === 'undefined') return false

    try {
      sessionStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      console.warn(`Error writing to sessionStorage key "${key}":`, error)
      return false
    }
  }

  remove(key: string): boolean {
    if (typeof window === 'undefined') return false

    try {
      sessionStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error)
      return false
    }
  }

  clear(): boolean {
    if (typeof window === 'undefined') return false

    try {
      sessionStorage.clear()
      return true
    } catch (error) {
      console.warn('Error clearing sessionStorage:', error)
      return false
    }
  }
}

// Create instances
export const localStorage = new LocalStorageManager()
export const sessionStorage = new SessionStorageManager()

// Application-specific storage utilities
export const userPreferences = {
  get: () => localStorage.get(STORAGE_KEYS.USER_PREFERENCES, {}),
  set: (prefs: Record<string, any>) => localStorage.set(STORAGE_KEYS.USER_PREFERENCES, prefs),
  update: (updates: Record<string, any>) => {
    const current = userPreferences.get()
    return localStorage.set(STORAGE_KEYS.USER_PREFERENCES, { ...current, ...updates })
  }
}

export const draftScript = {
  get: () => localStorage.get(STORAGE_KEYS.DRAFT_SCRIPT, ''),
  set: (script: string) => localStorage.set(STORAGE_KEYS.DRAFT_SCRIPT, script),
  clear: () => localStorage.remove(STORAGE_KEYS.DRAFT_SCRIPT)
}

export const selectedTemplate = {
  get: () => localStorage.get(STORAGE_KEYS.SELECTED_TEMPLATE),
  set: (template: any) => localStorage.set(STORAGE_KEYS.SELECTED_TEMPLATE, template),
  clear: () => localStorage.remove(STORAGE_KEYS.SELECTED_TEMPLATE)
}

export const selectedVoice = {
  get: () => localStorage.get(STORAGE_KEYS.SELECTED_VOICE),
  set: (voice: any) => localStorage.set(STORAGE_KEYS.SELECTED_VOICE, voice),
  clear: () => localStorage.remove(STORAGE_KEYS.SELECTED_VOICE)
}

export const theme = {
  get: () => localStorage.get(STORAGE_KEYS.THEME, 'light'),
  set: (themeName: string) => localStorage.set(STORAGE_KEYS.THEME, themeName)
}

export const language = {
  get: () => localStorage.get(STORAGE_KEYS.LANGUAGE, 'es'),
  set: (lang: string) => localStorage.set(STORAGE_KEYS.LANGUAGE, lang)
}

export const onboardingCompleted = {
  get: () => localStorage.get(STORAGE_KEYS.ONBOARDING_COMPLETED, false),
  set: (completed: boolean) => localStorage.set(STORAGE_KEYS.ONBOARDING_COMPLETED, completed)
}

// Storage event listeners
export const addStorageListener = (callback: (event: StorageEvent) => void) => {
  if (typeof window === 'undefined') return

  window.addEventListener('storage', callback)
  return () => window.removeEventListener('storage', callback)
}

// Storage quota management
export const getStorageQuota = async (): Promise<{ used: number; quota: number } | null> => {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null
  }

  try {
    const estimate = await navigator.storage.estimate()
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0
    }
  } catch (error) {
    console.warn('Error getting storage quota:', error)
    return null
  }
}

// Clear application data
export const clearAppData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.remove(key)
  })
}