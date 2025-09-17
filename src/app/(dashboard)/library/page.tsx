'use client'

import { useState } from 'react'
import { Header } from '@/components/common/header/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ClientNumber } from '@/components/ui/client-number'
import {
  Play,
  Download,
  Share2,
  Trash2,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Grid3X3,
  List,
  Eye,
  Calendar,
  Zap,
  TrendingUp,
  Timer
} from 'lucide-react'
import { MOCK_VIDEOS, Video } from '@/lib/data/videos'
import type { VideoStatus } from '@/lib/data/videos'
import { useRouter } from 'next/navigation'

export default function LibraryPage() {
  const router = useRouter()
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
        return <Clock className="w-4 h-4 text-primary animate-pulse" />
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

  const getStatusBadge = (status: VideoStatus) => {
    const baseClasses = "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`
      case 'processing':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`
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

  const handleCreateVideo = () => {
    // desplazar a la página de creación de video
    router.push('/create')
  }

  // Stats calculations
  const completedVideos = videos.filter(v => v.status === 'completed').length
  const processingVideos = videos.filter(v => v.status === 'processing').length
  const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0)
  const totalMinutes = Math.floor(videos.filter(v => v.status === 'completed').reduce((acc, v) => acc + v.duration, 0) / 60)

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header with Stats */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Mi Biblioteca
              </h1>
              <p className="text-muted-foreground mt-1">
                Gestiona todos tus videos generados
              </p>
            </div>
            <Button onClick={handleCreateVideo} className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Crear Video
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium">Videos</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{completedVideos}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200 dark:border-green-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 dark:text-green-400 text-sm font-medium">Visualizaciones</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      <ClientNumber value={totalViews} />
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Procesando</p>
                    <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{processingVideos}</p>
                  </div>
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-600 dark:text-purple-400 text-sm font-medium">Minutos</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{totalMinutes}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                    <Timer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 border-0 shadow-sm bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Buscar videos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-0 bg-muted/30 focus:bg-background transition-colors"
                  />
                </div>

                <div className="min-w-fit">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as VideoStatus | 'all')}
                    variant="creator"
                    options={[
                      { value: 'all', label: 'Todos los estados' },
                      { value: 'completed', label: 'Completados' },
                      { value: 'processing', label: 'Procesando' },
                      { value: 'failed', label: 'Con errores' }
                    ]}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="w-9 h-9 p-0 sm:w-auto sm:px-3"
                >
                  <Grid3X3 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Grid</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="w-9 h-9 p-0 sm:w-auto sm:px-3"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Lista</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Videos Grid/List */}
        {filteredVideos.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Play className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">No hay videos</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {searchQuery || statusFilter !== 'all'
                  ? 'No se encontraron videos que coincidan con los filtros'
                  : 'Aún no has creado ningún video. ¡Comienza ahora!'
                }
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear tu Primer Video
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredVideos.map((video) => (
              <Card
                key={video.id}
                className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-200 bg-card/50 backdrop-blur-sm"
              >
                <div className="aspect-[9/16] bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center text-4xl relative overflow-hidden">
                  {video.thumbnail}
                  {video.status === 'completed' && (
                    <Button
                      size="sm"
                      className="absolute inset-0 w-full h-full bg-black/0 hover:bg-black/20 border-0 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
                      </div>
                    </Button>
                  )}
                  <div className="absolute top-3 left-3">
                    <div className={getStatusBadge(video.status)}>
                      {getStatusIcon(video.status)}
                      {getStatusText(video.status)}
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-medium">
                    {formatDuration(video.duration)}
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                      {video.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{video.template}</span>
                      <span>•</span>
                      <span>{formatDate(video.createdAt)}</span>
                    </div>
                    {video.views && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Eye className="w-3 h-3" />
                        <ClientNumber value={video.views} />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-1">
                    {video.status === 'completed' && video.downloadUrl && (
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Descargar
                      </Button>
                    )}
                    {video.status === 'failed' && (
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                        Reintentar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(video.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3" />
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
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className="p-4 hover:bg-accent/5 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl flex items-center justify-center text-xl relative overflow-hidden">
                        {video.thumbnail}
                        {video.status === 'completed' && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                            <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold truncate pr-2">{video.title}</h3>
                          <div className={getStatusBadge(video.status)}>
                            {getStatusIcon(video.status)}
                            {getStatusText(video.status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(video.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Timer className="w-3 h-3" />
                            {formatDuration(video.duration)}
                          </span>
                          <span>{video.template}</span>
                          {video.views && (
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <ClientNumber value={video.views} />
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {video.status === 'completed' && (
                          <>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Play className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                              <Share2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {video.status === 'failed' && (
                          <Button size="sm" variant="outline" className="h-8">
                            Reintentar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(video.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
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
      </main>
    </div>
  )
}