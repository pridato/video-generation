/**
 * Local storage hook with type safety
 */
import { useState, useEffect, useCallback } from 'react'

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] => {
  // Get value from local storage or use initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      setStoredValue(valueToStore)

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  // Listen for changes to this key from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error)
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange)
      return () => window.removeEventListener('storage', handleStorageChange)
    }
  }, [key])

  return [storedValue, setValue, removeValue]
}

/**
 * Session storage hook with type safety
 */
export const useSessionStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, () => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.sessionStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.warn(`Error reading sessionStorage key "${key}":`, error)
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value

      setStoredValue(valueToStore)

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      console.warn(`Error setting sessionStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue)
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key)
      }
    } catch (error) {
      console.warn(`Error removing sessionStorage key "${key}":`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

/**
 * Hook for managing application-specific storage
 */
export const useAppStorage = () => {
  const [draftScript, setDraftScript, clearDraftScript] = useLocalStorage('draft_script', '')
  const [selectedTemplate, setSelectedTemplate, clearSelectedTemplate] = useLocalStorage('selected_template', null)
  const [selectedVoice, setSelectedVoice, clearSelectedVoice] = useLocalStorage('selected_voice', null)
  const [userPreferences, setUserPreferences] = useLocalStorage('user_preferences', {
    theme: 'dark',
    language: 'es',
    autoSave: true,
    notifications: true
  })

  const clearAllDrafts = useCallback(() => {
    clearDraftScript()
    clearSelectedTemplate()
    clearSelectedVoice()
  }, [clearDraftScript, clearSelectedTemplate, clearSelectedVoice])

  const updatePreference = useCallback((key: string, value: any) => {
    setUserPreferences(prev => ({
      ...prev,
      [key]: value
    }))
  }, [setUserPreferences])

  return {
    draftScript,
    setDraftScript,
    clearDraftScript,
    selectedTemplate,
    setSelectedTemplate,
    clearSelectedTemplate,
    selectedVoice,
    setSelectedVoice,
    clearSelectedVoice,
    userPreferences,
    setUserPreferences,
    updatePreference,
    clearAllDrafts
  }
}