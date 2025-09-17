'use client'

import { useState } from 'react'
import { Header } from '@/components/ui/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useSubscription } from '@/hooks/useSubscription'
import {
  Search,
  Play,
  Crown,
  Eye,
  Heart,
  Copy,
  Filter,
  Grid3X3,
  List,
  CheckCircle,
  Lock,
  Zap,
  TrendingUp
} from 'lucide-react'

const TEMPLATE_CATEGORIES = [
  { id: 'all', name: 'Todos', count: 24 },
  { id: 'tech', name: 'Tecnología', count: 8 },
  { id: 'education', name: 'Educación', count: 6 },
  { id: 'business', name: 'Business', count: 5 },
  { id: 'entertainment', name: 'Entretenimiento', count: 5 }
]

const TEMPLATES = [
  {
    id: 'modern-tech',
    name: 'Modern Tech',
    description: 'Diseño limpio para tutoriales de programación',
    category: 'tech',
    preview: '💻',
    color: 'from-blue-500 to-cyan-500',
    isPremium: false,
    views: 15420,
    likes: 892,
    used: 2340,
    tags: ['Código', 'Tutorial', 'Moderno'],
    videoUrl: '/previews/modern-tech.mp4'
  },
  {
    id: 'neon-cyberpunk',
    name: 'Neon Cyberpunk',
    description: 'Estilo futurista con efectos neón',
    category: 'tech',
    preview: '🌆',
    color: 'from-purple-500 to-pink-500',
    isPremium: true,
    views: 23180,
    likes: 1204,
    used: 1890,
    tags: ['Futurista', 'Neón', 'Premium'],
    videoUrl: '/previews/neon-cyberpunk.mp4'
  },
  {
    id: 'minimal-education',
    name: 'Minimal Education',
    description: 'Enfoque en el contenido educativo',
    category: 'education',
    preview: '📚',
    color: 'from-green-500 to-emerald-500',
    isPremium: false,
    views: 8950,
    likes: 456,
    used: 1123,
    tags: ['Educativo', 'Limpio', 'Simple'],
    videoUrl: '/previews/minimal-education.mp4'
  },
  {
    id: 'business-pro',
    name: 'Business Pro',
    description: 'Profesional para contenido empresarial',
    category: 'business',
    preview: '💼',
    color: 'from-gray-600 to-gray-800',
    isPremium: true,
    views: 12340,
    likes: 678,
    used: 890,
    tags: ['Profesional', 'Corporativo', 'Premium'],
    videoUrl: '/previews/business-pro.mp4'
  },
  {
    id: 'colorful-fun',
    name: 'Colorful Fun',
    description: 'Vibrante y energético para entretenimiento',
    category: 'entertainment',
    preview: '🎨',
    color: 'from-orange-500 to-red-500',
    isPremium: false,
    views: 19870,
    likes: 1532,
    used: 3210,
    tags: ['Colorido', 'Divertido', 'Viral'],
    videoUrl: '/previews/colorful-fun.mp4'
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode Elite',
    description: 'Elegante tema oscuro premium',
    category: 'tech',
    preview: '🌙',
    color: 'from-gray-800 to-black',
    isPremium: true,
    views: 16750,
    likes: 923,
    used: 1456,
    tags: ['Oscuro', 'Elegante', 'Premium'],
    videoUrl: '/previews/dark-mode.mp4'
  }
]

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const { hasAccess, createCheckoutSession } = useSubscription()

  const filteredTemplates = TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleUseTemplate = (template: any) => {
    if (template.isPremium && !hasAccess('premium_templates')) {
      // Redirect to upgrade
      createCheckoutSession('pro', false)
      return
    }

    // Use template
    setSelectedTemplate(template.id)
    // Redirect to create page with template
    window.location.href = `/create?template=${template.id}`
  }

  const handlePreview = (template: any) => {
    // Show preview modal or navigate to preview
    console.log('Preview template:', template.id)
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
            <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg">
              <Zap className="w-4 h-4 mr-2" />
              Crear Video
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24</div>
              <div className="text-sm text-muted-foreground">Templates</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">8</div>
              <div className="text-sm text-muted-foreground">Premium</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-xl">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">12K+</div>
              <div className="text-sm text-muted-foreground">Videos Creados</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 rounded-xl">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">98%</div>
              <div className="text-sm text-muted-foreground">Satisfacción</div>
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
                </div>

                <div className="flex gap-2 overflow-x-auto">
                  {TEMPLATE_CATEGORIES.map((category) => (
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
                  {template.preview}

                  {/* Premium Badge */}
                  {template.isPremium && (
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
                        className="bg-primary hover:bg-primary/90 text-white"
                      >
                        {template.isPremium && !hasAccess('premium_templates') ? (
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
                      {(template.views / 1000).toFixed(1)}K
                    </div>
                    <div className="bg-black/70 px-2 py-1 rounded flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {template.likes}
                    </div>
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
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-muted px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
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
                      disabled={template.isPremium && !hasAccess('premium_templates')}
                      className={`
                        flex-1 h-8 text-xs
                        ${template.isPremium && !hasAccess('premium_templates')
                          ? 'bg-amber-500 hover:bg-amber-600 text-white'
                          : 'bg-primary hover:bg-primary/90 text-white'
                        }
                      `}
                    >
                      {template.isPremium && !hasAccess('premium_templates') ? (
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
                        {template.preview}
                        {template.isPremium && (
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
                              {(template.views / 1000).toFixed(1)}K
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3 h-3" />
                              {template.likes}
                            </span>
                            <span className="flex items-center gap-1">
                              <Copy className="w-3 h-3" />
                              {template.used}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {template.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs bg-muted px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
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
                          disabled={template.isPremium && !hasAccess('premium_templates')}
                          className={`
                            h-8
                            ${template.isPremium && !hasAccess('premium_templates')
                              ? 'bg-amber-500 hover:bg-amber-600 text-white'
                              : 'bg-primary hover:bg-primary/90 text-white'
                            }
                          `}
                        >
                          {template.isPremium && !hasAccess('premium_templates') ? (
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
        {filteredTemplates.length === 0 && (
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