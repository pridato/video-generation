/**
 * Theme management hook
 */
import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

type Theme = 'light' | 'dark' | 'system'

export const useTheme = () => {
  const [storedTheme, setStoredTheme] = useLocalStorage<Theme>('theme', 'system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

  // Detect system theme preference
  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [])

  // Resolve theme based on stored preference
  const resolveTheme = useCallback((theme: Theme): 'light' | 'dark' => {
    if (theme === 'system') {
      return getSystemTheme()
    }
    return theme
  }, [getSystemTheme])

  // Apply theme to document
  const applyTheme = useCallback((theme: 'light' | 'dark') => {
    if (typeof document === 'undefined') return

    const root = document.documentElement

    if (theme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0F0F23' : '#FAFAFA')
    }
  }, [])

  // Set theme
  const setTheme = useCallback((theme: Theme) => {
    setStoredTheme(theme)
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [setStoredTheme, resolveTheme, applyTheme])

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }, [resolvedTheme, setTheme])

  // Initialize theme on mount
  useEffect(() => {
    const resolved = resolveTheme(storedTheme)
    setResolvedTheme(resolved)
    applyTheme(resolved)
  }, [storedTheme, resolveTheme, applyTheme])

  // Listen for system theme changes
  useEffect(() => {
    if (storedTheme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      const systemTheme = getSystemTheme()
      setResolvedTheme(systemTheme)
      applyTheme(systemTheme)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [storedTheme, getSystemTheme, applyTheme])

  return {
    theme: storedTheme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isLight: resolvedTheme === 'light',
    isDark: resolvedTheme === 'dark',
    isSystem: storedTheme === 'system'
  }
}

/**
 * Hook for getting theme-aware CSS variables
 */
export const useThemeColors = () => {
  const { resolvedTheme } = useTheme()

  return {
    primary: resolvedTheme === 'dark' ? '#FF6B35' : '#FF6B35',
    secondary: resolvedTheme === 'dark' ? '#F7931E' : '#F7931E',
    accent: resolvedTheme === 'dark' ? '#00D9FF' : '#00D9FF',
    background: resolvedTheme === 'dark' ? '#0F0F23' : '#FAFAFA',
    foreground: resolvedTheme === 'dark' ? '#FAFAFA' : '#0F0F23',
    muted: resolvedTheme === 'dark' ? '#1A1A2E' : '#F5F5F5',
    border: resolvedTheme === 'dark' ? '#2A2A3E' : '#E5E5E5',
    success: '#00C896',
    warning: '#FFB800',
    error: '#EF4444'
  }
}