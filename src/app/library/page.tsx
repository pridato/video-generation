'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  Play, 
  Download, 
  Share2, 
  Trash2, 
  Filter, 
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Grid3X3,
  List,
  Calendar,
  Eye
} from 'lucide-react'

type VideoStatus = 'processing' | 'completed' | 'failed'

interface Video {
  id: string
  title: string
  thumbnail: string
  duration: number
  status: VideoStatus
  createdAt: string
  template: string
  views?: number
  downloadUrl?: string
}

// Datos de ejemplo
const MOCK_VIDEOS: Video[] = [
  {
    id: '1',
    title: 'React Hooks Explicados',
    thumbnail: '🖥️',
    duration: 45,
    status: 'completed',
    createdAt: '2024-01-15',
    template: 'Tutorial Tecnológico',
    views: 1250,
    downloadUrl: '/videos/react-hooks.mp4'
  },
  {
    id: '2',
    title: '5 Trucos de JavaScript',
    thumbnail: '⚡',
    duration: 38,
    status: 'completed',
    createdAt: '2024-01-12',
    template: 'Datos Virales',
    views: 3800,
    downloadUrl: '/videos/js-tricks.mp4'
  },
  {
    id: '3',
    title: 'Consejos para Programadores',
    thumbnail: '💡',
    duration: 52,
    status: 'completed',
    createdAt: '2024-01-10',
    template: 'Consejos de Vida',
    views: 890,
    downloadUrl: '/videos/dev-tips.mp4'
  },
  {
    id: '4',
    title: 'Tutorial de Next.js',
    thumbnail: '🚀',
    duration: 0,
    status: 'processing',
    createdAt: '2024-01-16',
    template: 'Tutorial Tecnológico'
  },
  {
    id: '5',
    title: 'TypeScript para Principiantes',
    thumbnail: '❌',
    duration: 0,
    status: 'failed',
    createdAt: '2024-01-14',
    template: 'Tutorial Tecnológico'
  }
]

export default function LibraryPage() {
  const [videos, setVideos] = useState<Video[]>(MOCK_VIDEOS)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<VideoStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || video.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: VideoStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />
      case 'processing':
        return <Clock className="w-4 h-4 text-primary ai-working" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />
    }
  }

  const getStatusText = (status: VideoStatus) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'processing':
        return 'Procesando'
      case 'failed':
        return 'Error'
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '--'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const handleDelete = (videoId: string) => {
    setVideos(videos.filter(v => v.id !== videoId))
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Mi Biblioteca
              </h1>
              <p className="text-muted-foreground mt-2">
                Gestiona todos tus videos generados
              </p>
            </div>
            <Button className="btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Crear Video
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="card-glow mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as VideoStatus | 'all')}
                  className="px-3 py-2 border border-border rounded-lg bg-input text-foreground"
                >
                  <option value="all">Todos los estados</option>
                  <option value="completed">Completados</option>
                  <option value="processing">Procesando</option>
                  <option value="failed">Con errores</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Grid/List */}
        {filteredVideos.length === 0 ? (
          <Card className="card-glow">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No hay videos</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No se encontraron videos que coincidan con los filtros'
                  : 'Aún no has creado ningún video. ¡Comienza ahora!'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear tu Primer Video
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="card-glow overflow-hidden">
                <div className="aspect-[9/16] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl relative">
                  {video.thumbnail}
                  {video.status === 'completed' && (
                    <Button
                      size="sm"
                      className="absolute top-2 right-2 w-8 h-8 p-0 bg-black/50 hover:bg-black/70"
                    >
                      <Play className="w-3 h-3 text-white" />
                    </Button>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                      {video.title}
                    </h3>
                    {getStatusIcon(video.status)}
                  </div>
                  
                  <div className="space-y-1 text-xs text-muted-foreground mb-3">
                    <p>{video.template}</p>
                    <p>{formatDate(video.createdAt)}</p>
                    {video.views && (
                      <p className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {video.views.toLocaleString()} visualizaciones
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {video.status === 'completed' && video.downloadUrl && (
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-3 h-3 mr-1" />
                        Descargar
                      </Button>
                    )}
                    {video.status === 'failed' && (
                      <Button size="sm" variant="outline" className="flex-1">
                        Reintentar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(video.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-glow">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredVideos.map((video) => (
                  <div key={video.id} className="p-4 hover:bg-accent/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center text-xl">
                        {video.thumbnail}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{video.title}</h3>
                          {getStatusIcon(video.status)}
                          <span className="text-xs text-muted-foreground">
                            {getStatusText(video.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{video.template}</span>
                          <span>{formatDate(video.createdAt)}</span>
                          <span>{formatDuration(video.duration)}</span>
                          {video.views && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {video.views.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {video.status === 'completed' && (
                          <>
                            <Button size="sm" variant="outline">
                              <Play className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Share2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {video.status === 'failed' && (
                          <Button size="sm" variant="outline">
                            Reintentar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(video.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="card-glow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {videos.filter(v => v.status === 'completed').length}
              </div>
              <div className="text-xs text-muted-foreground">Completados</div>
            </CardContent>
          </Card>
          
          <Card className="card-glow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent mb-1">
                {videos.filter(v => v.status === 'processing').length}
              </div>
              <div className="text-xs text-muted-foreground">Procesando</div>
            </CardContent>
          </Card>
          
          <Card className="card-glow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary mb-1">
                {videos.reduce((acc, v) => acc + (v.views || 0), 0).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">Visualizaciones</div>
            </CardContent>
          </Card>
          
          <Card className="card-glow">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success mb-1">
                {Math.floor(videos.filter(v => v.status === 'completed').reduce((acc, v) => acc + v.duration, 0) / 60)}
              </div>
              <div className="text-xs text-muted-foreground">Minutos creados</div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}