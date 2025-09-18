'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/common/header/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSubscription } from '@/hooks/subscription'
import { useTemplates } from '@/lib/services/templates/templatesManager'
import { Template } from '@/lib/services/supabase/templates'
import {
  Search,
  Play,
  Crown,
  Eye,
  Heart,
  Copy,
  Grid3X3,
  List,
  Lock,
  Zap,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/auth'
import { useRouter } from 'next/navigation'

export default function TemplatesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const { hasAccess, createCheckoutSession } = useSubscription()
  const { profile } = useAuth()
  const {
    templates,
    categories,
    loading,
    error,
    searchTemplates,
    getTemplatesByCategory,
    incrementTemplateViews,
    incrementTemplateLikes,
    incrementTemplateUsage,
    refreshTemplates
  } = useTemplates()

  // Filter templates based on search and category
  useEffect(() => {
    const filterTemplates = async () => {
      setIsSearching(true)
      try {
        let results: Template[] = []

        if (searchQuery.trim()) {
          results = await searchTemplates(searchQuery)
        } else if (selectedCategory === 'all') {
          results = templates
        } else {
          results = await getTemplatesByCategory(selectedCategory)
        }

        // Apply additional filters if needed
        if (searchQuery.trim() && selectedCategory !== 'all') {
          results = results.filter(template => template.category === selectedCategory)
        }

        setFilteredTemplates(results)
      } catch (err) {
        console.error('Error filtering templates:', err)
        setFilteredTemplates([])
      } finally {
        setIsSearching(false)
      }
    }

    filterTemplates()
  }, [searchQuery, selectedCategory, templates, searchTemplates, getTemplatesByCategory])

  /**
   * Maneja la selección de un template
   */
  const handleUseTemplate = async (template: Template) => {
    if (template.is_premium && !hasAccess('premium_templates', profile?.subscription_tier || 'free')) {
      createCheckoutSession('pro', false)
      return
    }

    try {
      await incrementTemplateUsage(template.id)
      setSelectedTemplate(template.id)
      router.push(`/create?template=${template.id}`)
    } catch (err) {
      console.error('Error using template:', err)
    }
  }

  const handlePreview = async (template: Template) => {
    try {
      await incrementTemplateViews(template.id)
      console.log('Preview template:', template.id)
      // Aquí puedes implementar un modal de preview o navegación
    } catch (err) {
      console.error('Error previewing template:', err)
    }
  }

  const handleLike = async (template: Template) => {
    try {
      await incrementTemplateLikes(template.id)
    } catch (err) {
      console.error('Error liking template:', err)
    }
  }

  

  const formatNumber = (num: number | undefined): string => {
    if (!num) return '0'
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Cargando templates...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error al cargar templates</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refreshTemplates} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Galería de Templates
              </h1>
              <p className="text-muted-foreground mt-1">
                Descubre diseños profesionales para tus videos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                onClick={refreshTemplates}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button 
                onClick={() => router.push('/create')}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                Crear Video
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {templates.length}
              </div>
              <div className="text-sm text-muted-foreground">Templates</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {templates.filter(t => t.is_premium).length}
              </div>
              <div className="text-sm text-muted-foreground">Premium</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatNumber(templates.reduce((sum, t) => sum + (t.uses || 0), 0))}
              </div>
              <div className="text-sm text-muted-foreground">Videos Creados</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-xl">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatNumber(templates.reduce((sum, t) => sum + (t.likes || 0), 0))}
              </div>
              <div className="text-sm text-muted-foreground">Me Gusta</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="relative flex-1 lg:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-0 bg-muted/30 focus:bg-background transition-colors"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                <div className="flex gap-2 overflow-x-auto">
                  {categories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="whitespace-nowrap"
                    >
                      {category.name} ({category.count})
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="w-9 h-9 p-0"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="w-9 h-9 p-0"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template) => (
              <Card
                key={template.id}
                className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm"
              >
                <div className="aspect-[9/16] bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center text-6xl relative overflow-hidden">
                  🎬

                  {/* Premium Badge */}
                  {template.is_premium && (
                    <div className="absolute top-3 left-3">
                      <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        PRO
                      </div>
                    </div>
                  )}

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePreview(template)}
                        className="bg-white/90 hover:bg-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleUseTemplate(template)}
                        disabled={selectedTemplate === template.id}
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        {selectedTemplate === template.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : template.is_premium && !hasAccess('premium_templates', profile?.subscription_tier || 'free') ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between text-white text-xs">
                    <div className="bg-black/70 px-2 py-1 rounded flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(template.uses)}
                    </div>
                    <button
                      onClick={() => handleLike(template)}
                      className="bg-black/70 px-2 py-1 rounded flex items-center gap-1 hover:bg-black/90 transition-colors"
                    >
                      <Heart className="w-3 h-3" />
                      {formatNumber(template.likes)}
                    </button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {template.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground capitalize">
                        {template.category}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(template.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(template)}
                      className="flex-1 h-8 text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      disabled={template.is_premium && !hasAccess('premium_templates', profile?.subscription_tier || 'free') || selectedTemplate === template.id}
                      className={`
                        flex-1 h-8 text-xs
                        ${template.is_premium && !hasAccess('premium_templates', profile?.subscription_tier || 'free')
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-primary hover:bg-primary/90 text-white'
                        }
                      `}
                    >
                      {selectedTemplate === template.id ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : template.is_premium && !hasAccess('premium_templates', profile?.subscription_tier || 'free') ? (
                        <>
                          <Crown className="w-3 h-3 mr-1" />
                          Upgrade
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 mr-1" />
                          Usar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl flex items-center justify-center text-2xl relative">
                        🎬
                        {template.is_premium && (
                          <div className="absolute -top-1 -right-1">
                            <Crown className="w-4 h-4 text-amber-500" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {formatNumber(template.uses)}
                            </span>
                            <button
                              onClick={() => handleLike(template)}
                              className="flex items-center gap-1 hover:text-foreground transition-colors"
                            >
                              <Heart className="w-3 h-3" />
                              {formatNumber(template.likes)}
                            </button>
                            <span className="flex items-center gap-1">
                              <Copy className="w-3 h-3" />
                              {formatNumber(template.uses)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground capitalize bg-muted px-2 py-1 rounded-full">
                            {template.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(template.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreview(template)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template)}
                          disabled={template.is_premium && !hasAccess('premium_templates', profile?.subscription_tier || 'free') || selectedTemplate === template.id}
                          className={`
                            h-8
                            ${template.is_premium && !hasAccess('premium_templates', profile?.subscription_tier || 'free')
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'bg-primary hover:bg-primary/90 text-white'
                            }
                          `}
                        >
                          {selectedTemplate === template.id ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : template.is_premium && !hasAccess('premium_templates', profile?.subscription_tier || 'free') ? (
                            <>
                              <Crown className="w-3 h-3 mr-1" />
                              Upgrade
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Usar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredTemplates.length === 0 && !isSearching && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">No se encontraron templates</h3>
              <p className="text-muted-foreground mb-6">
                Prueba ajustando los filtros o cambiando tu búsqueda
              </p>
              <Button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('all')
                }}
                variant="outline"
              >
                Limpiar Filtros
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading State for Search */}
        {isSearching && (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Buscando templates...</p>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <Card className="mt-12 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ¿No encuentras lo que buscas?
              </span>
            </h2>
            <p className="text-muted-foreground mb-6">
              Solicita un template personalizado o únete al plan Pro para acceder a diseños exclusivos
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                className="px-6"
              >
                Solicitar Template
              </Button>
              <Button
                onClick={() => createCheckoutSession('pro', false)}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-6"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade a Pro
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}