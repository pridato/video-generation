'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { useSubscription } from '@/hooks/useSubscription'
import { getPopularTemplates, getTemplateCategories, type Template } from '@/lib/supabase/templates'
import { Play, LogOut, User, Menu, X, Palette, BarChart3, CreditCard, ChevronDown, Star, Crown } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const supabase = createClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false)
  const [popularTemplates, setPopularTemplates] = useState<Template[]>([])
  const [templateCategories, setTemplateCategories] = useState<string[]>([])
  const { hasAccess } = useSubscription()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)

        // Load templates if authenticated
        if (session) {
          const [templates, categories] = await Promise.all([
            getPopularTemplates(6),
            getTemplateCategories()
          ])
          setPopularTemplates(templates)
          setTemplateCategories(categories)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session)

      if (session) {
        const [templates, categories] = await Promise.all([
          getPopularTemplates(6),
          getTemplateCategories()
        ])
        setPopularTemplates(templates)
        setTemplateCategories(categories)
      } else {
        setPopularTemplates([])
        setTemplateCategories([])
      }
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

          {/* Desktop Navigation */}
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
                <Link href="/auth/login" className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors">
                  Iniciar Sesión
                </Link>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg">
                  <Link href="/auth/register">Empezar Gratis</Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
                <div className="relative">
                  <button
                    onMouseEnter={() => setIsTemplatesOpen(true)}
                    onMouseLeave={() => setIsTemplatesOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <Palette className="w-4 h-4" />
                    Templates
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {isTemplatesOpen && (
                    <div
                      onMouseEnter={() => setIsTemplatesOpen(true)}
                      onMouseLeave={() => setIsTemplatesOpen(false)}
                      className="absolute top-full left-0 mt-2 w-96 bg-background border border-border rounded-xl shadow-xl z-50 p-6"
                    >
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-semibold mb-3 flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            Templates Populares
                          </h3>
                          <div className="grid grid-cols-2 gap-3">
                            {popularTemplates.slice(0, 4).map((template) => (
                              <Link
                                key={template.id}
                                href={`/templates/${template.id}`}
                                className="group p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="w-6 h-6 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-md flex items-center justify-center text-xs">
                                    {template.category?.charAt(0)?.toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium group-hover:text-primary">{template.name}</span>
                                  {template.is_premium && <Crown className="w-3 h-3 text-yellow-500" />}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                              </Link>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-3">Categorías</h4>
                          <div className="flex flex-wrap gap-2">
                            {templateCategories.slice(0, 6).map((category) => (
                              <Link
                                key={category}
                                href={`/templates?category=${category}`}
                                className="px-3 py-1 bg-muted/50 hover:bg-muted rounded-full text-xs font-medium transition-colors capitalize"
                              >
                                {category}
                              </Link>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border">
                          <Link
                            href="/templates"
                            className="flex items-center justify-center gap-2 text-primary hover:text-primary/80 font-medium text-sm"
                          >
                            Ver Todos los Templates
                            <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {hasAccess('PRO') && (
                  <Link href="/analytics" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </Link>
                )}
                <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <CreditCard className="w-4 h-4" />
                  Créditos
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
                  className="hidden sm:flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Salir</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md">
            <div className="px-4 py-4 space-y-4">
              {!isAuthenticated ? (
                <>
                  <a href="#features" className="block text-muted-foreground hover:text-foreground transition-colors py-2">
                    Características
                  </a>
                  <Link href="/pricing" className="block text-muted-foreground hover:text-foreground transition-colors py-2">
                    Precios
                  </Link>
                  <a href="#testimonials" className="block text-muted-foreground hover:text-foreground transition-colors py-2">
                    Testimonios
                  </a>
                  <hr className="border-border/50" />
                  <Link href="/auth/login" className="block text-muted-foreground hover:text-foreground transition-colors py-2">
                    Iniciar Sesión
                  </Link>
                  <Link href="/auth/register" className="block bg-gradient-to-r from-primary to-secondary text-white text-center py-3 rounded-lg font-medium">
                    Empezar Gratis
                  </Link>
                </>
              ) : (
                <>
                  <Link href={ROUTES.CREATE} className="block text-muted-foreground hover:text-foreground transition-colors py-2">
                    Crear Video
                  </Link>
                  <Link href={ROUTES.LIBRARY} className="block text-muted-foreground hover:text-foreground transition-colors py-2">
                    Mi Biblioteca
                  </Link>
                  <Link href="/templates" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2">
                    <Palette className="w-4 h-4" />
                    Templates
                  </Link>
                  {hasAccess('PRO') && (
                    <Link href="/analytics" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2">
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </Link>
                  )}
                  <Link href="/pricing" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2">
                    <CreditCard className="w-4 h-4" />
                    Comprar Créditos
                  </Link>
                  <hr className="border-border/50" />
                  <Link href={ROUTES.SETTINGS} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2">
                    <User className="w-4 h-4" />
                    Mi Perfil
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors py-2 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}