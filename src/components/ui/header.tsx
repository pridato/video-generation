'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Play, LogOut, User } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push(ROUTES.HOME)
  }

  const handleLogoClick = () => {
    if (isAuthenticated) {
      router.push(ROUTES.DASHBOARD)
    } else {
      router.push(ROUTES.HOME)
    }
  }

  if (isLoading) {
    return (
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ShortsAI
              </span>
            </div>
            <div className="w-24 h-8 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <button
            onClick={handleLogoClick}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-white" fill="currentColor" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ShortsAI
            </span>
          </button>

          {!isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center space-x-8">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Características
                </a>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Precios
                </Link>
                <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
                  Testimonios
                </a>
              </div>

              <div className="flex items-center space-x-4">
                <Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors">
                  Iniciar Sesión
                </Link>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg">
                  <Link href="/auth/register">Empezar Gratis</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center space-x-8">
                <Link href={ROUTES.CREATE} className="text-muted-foreground hover:text-foreground transition-colors">
                  Crear
                </Link>
                <Link href={ROUTES.LIBRARY} className="text-muted-foreground hover:text-foreground transition-colors">
                  Biblioteca
                </Link>
                <Link href="/templates" className="text-muted-foreground hover:text-foreground transition-colors">
                  Templates
                </Link>
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Precios
                </Link>
              </div>

              <div className="flex items-center space-x-4">
                <Link href={ROUTES.SETTINGS} className="text-muted-foreground hover:text-foreground transition-colors">
                  <User className="w-4 h-4" />
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}