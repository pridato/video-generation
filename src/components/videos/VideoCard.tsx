import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Download,
  Share2,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Timer,
} from 'lucide-react'
import Image from 'next/image'
import type { VideoProject } from '@/types'
import { StorageBucket } from '@/lib/services/supabase/storage'

export type VideoStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'

interface VideoCardProps {
  video: VideoProject & {
    views?: number
    engagement_rate?: number
  }
  variant?: 'grid' | 'list'
  onDelete?: (videoId: string) => void
  onDownload?: (videoId: string) => void
  onShare?: (videoId: string) => void
  onPlay?: (videoId: string) => void
  showActions?: boolean
  showThumbnail?: boolean
}

export function VideoCard({
  video,
  variant = 'grid',
  onDelete,
  onDownload,
  onShare,
  onPlay,
  showActions,
  showThumbnail = true
}: VideoCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)

  const getStatusIcon = (status: VideoStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
      case 'queued':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: VideoStatus) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'processing':
        return 'Procesando'
      case 'queued':
        return 'En cola'
      case 'failed':
        return 'Error'
      case 'cancelled':
        return 'Cancelado'
      default:
        return 'Desconocido'
    }
  }

  const getStatusBadgeVariant = (status: VideoStatus): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'completed':
        return 'default'
      case 'processing':
      case 'queued':
        return 'secondary'
      case 'failed':
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds || seconds === 0) return '--'
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

  const formatViews = (views?: number) => {
    if (!views) return '0'
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`
    }
    if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`
    }
    return views.toString()
  }

  const handleDownload = async () => {
    if (!video.video_url || !onDownload) return

    setIsDownloading(true)
    try {
      // Si es una URL de Supabase Storage, usar utilidades de storage
      if (video.video_url.includes('supabase')) {
        // Extraer path de la URL de storage
        const urlParts = video.video_url.split('/')
        const bucketIndex = urlParts.findIndex(part => part === 'storage')
        if (bucketIndex !== -1 && bucketIndex + 3 < urlParts.length) {
          const bucket = urlParts[bucketIndex + 2] as StorageBucket
          const path = urlParts.slice(bucketIndex + 3).join('/')

          // Crear URL firmada para descarga segura
          const { createSignedUrl } = await import('@/lib/services/supabase/storage')
          const result = await createSignedUrl(bucket, path, 3600) // 1 hora

          if (result.success && result.data) {
            // Crear enlace de descarga
            const link = document.createElement('a')
            link.href = result.data.signedUrl
            link.download = `${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`
            link.click()
          }
        }
      } else {
        // URL externa, descarga directa
        const link = document.createElement('a')
        link.href = video.video_url
        link.download = `${video.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`
        link.click()
      }

      onDownload(video.id)
    } catch (error) {
      console.error('Error downloading video:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = () => {
    if (onShare) {
      onShare(video.id)
    } else {
      // Funcionalidad de compartir por defecto
      if (navigator.share) {
        navigator.share({
          title: video.title,
          text: `Mira este video: ${video.title}`,
          url: video.video_url || window.location.href
        })
      } else {
        // Fallback: copiar al portapapeles
        navigator.clipboard.writeText(video.video_url || window.location.href)
      }
    }
  }

  const getThumbnailUrl = () => {
    if (video.thumbnail_url) {
      // Si es una URL de Supabase Storage, obtener URL pública
      if (video.thumbnail_url.includes('supabase')) {
        return video.thumbnail_url
      }
      return video.thumbnail_url
    }

    // Thumbnail por defecto basado en estado
    return null
  }

  const ThumbnailPlaceholder = () => (
    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-4xl">
      {video.status === 'completed' ? '🎬' :
       video.status === 'processing' || video.status === 'queued' ? '⏳' :
       video.status === 'failed' ? '❌' : '📹'}
    </div>
  )

  if (variant === 'list') {
    return (
      <div className="p-4 hover:bg-accent/5 transition-colors group border-b border-border/50 last:border-b-0 flex items-center gap-4">
        <div className="flex items-center gap-4">
          {showThumbnail && (
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted relative flex-shrink-0">
                <Image
                  src={getThumbnailUrl()!}
                  alt={video.title}
                  className="w-full h-full object-cover"
                  fill
                  sizes="80px"
                  onError={() => setThumbnailError(true)}
                  style={{ objectFit: 'cover' }}
                  priority={true}
                />
              <div />
              {thumbnailError ? (
                <ThumbnailPlaceholder />
              ) : (
                <ThumbnailPlaceholder />
              )}
              {video.status === 'completed' && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <Play
                    className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={() => onPlay?.(video.id)}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold truncate pr-2 text-foreground">{video.title}</h3>
              <Badge variant={getStatusBadgeVariant(video.status)} className="flex items-center gap-1 text-xs">
                {getStatusIcon(video.status)}
                {getStatusText(video.status)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Timer className="w-3 h-3" />
                {formatDuration(video.duration || video.actual_duration)}
              </span>
              <span>{formatDate(video.created_at)}</span>
              {video.views && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatViews(video.views)}
                </span>
              )}
              {video.engagement_rate && (
                <span>📈 {(video.engagement_rate * 100).toFixed(1)}%</span>
              )}
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {video.status === 'completed' && (
                <>
                  {onPlay && (
                    <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => onPlay(video.id)}>
                      <Play className="w-3 h-3" />
                    </Button>
                  )}
                  {video.video_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      <Download className={`w-3 h-3 ${isDownloading ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handleShare}>
                    <Share2 className="w-3 h-3" />
                  </Button>
                </>
              )}
              {video.status === 'failed' && (
                <Button size="sm" variant="outline" className="h-8">
                  Reintentar
                </Button>
              )}
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(video.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Grid variant
  return (
    <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-200 bg-card/50 backdrop-blur-sm">
      {showThumbnail && (
        <div className="aspect-[9/16] bg-muted relative overflow-hidden">
          {getThumbnailUrl() && !thumbnailError ? (
            <Image
              src={getThumbnailUrl()!}
              alt={video.title}
              className="w-full h-full object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              onError={() => setThumbnailError(true)}
              style={{ objectFit: 'cover' }}
              priority={true}
            />
          ) : (
            <ThumbnailPlaceholder />
          )}

          {video.status === 'completed' && onPlay && (
            <Button
              size="sm"
              className="absolute inset-0 w-full h-full bg-black/0 hover:bg-black/20 border-0 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              onClick={() => onPlay(video.id)}
            >
              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-black ml-0.5" fill="currentColor" />
              </div>
            </Button>
          )}

          <div className="absolute top-3 left-3">
            <Badge variant={getStatusBadgeVariant(video.status)} className="flex items-center gap-1 text-xs">
              {getStatusIcon(video.status)}
              {getStatusText(video.status)}
            </Badge>
          </div>

          <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-md font-medium">
            {formatDuration(video.duration || video.actual_duration)}
          </div>
        </div>
      )}

      <CardContent className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 text-foreground">
            {video.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(video.created_at)}</span>
            {video.views && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {formatViews(video.views)}
                </span>
              </>
            )}
            {video.engagement_rate && (
              <>
                <span>•</span>
                <span>📈 {(video.engagement_rate * 100).toFixed(1)}%</span>
              </>
            )}
          </div>
        </div>

        {showActions && (
          <div className="flex gap-1">
            {video.status === 'completed' && video.video_url && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
                onClick={handleDownload}
                disabled={isDownloading}
              >
                <Download className={`w-3 h-3 mr-1 ${isDownloading ? 'animate-spin' : ''}`} />
                {isDownloading ? 'Descargando...' : 'Descargar'}
              </Button>
            )}
            {video.status === 'failed' && (
              <Button size="sm" variant="outline" className="flex-1 h-8 text-xs">
                Reintentar
              </Button>
            )}
            {video.status === 'completed' && (
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handleShare}>
                <Share2 className="w-3 h-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(video.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}