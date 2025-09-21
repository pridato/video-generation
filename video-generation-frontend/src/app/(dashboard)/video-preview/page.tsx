'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/auth'
import { useToast } from '@/hooks/ui'
import { Header } from '@/components/common/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Download,
  Share2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Heart,
  MessageCircle,
  Send,
  Copy,
  ExternalLink,
  Smartphone,
  Monitor,
  Loader2,
  CheckCircle
} from 'lucide-react'

interface VideoData {
  video_id: string
  video_url: string
  thumbnail_url?: string
  duration: number
  file_size: number
  download_url: string
  metadata: {
    clips_count: number
    audio_duration: number
    title: string
  }
}

export default function VideoPreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { success, error } = useToast()

  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingVideo, setDownloadingVideo] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Obtener video data desde URL params o localStorage
  useEffect(() => {
    const videoDataParam = searchParams.get('videoData')
    if (videoDataParam) {
      try {
        const data = JSON.parse(decodeURIComponent(videoDataParam))
        setVideoData(data)
        setIsLoading(false)
      } catch (e) {
        error('Error cargando datos del video')
        router.push('/create')
      }
    } else {
      error('No se encontraron datos del video')
      router.push('/create')
    }
  }, [searchParams])

  const handleDownload = async () => {
    if (!videoData) return

    setDownloadingVideo(true)
    try {
      const response = await fetch(`http://localhost:8000${videoData.download_url}`)
      if (!response.ok) throw new Error('Error descargando video')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${videoData.metadata.title}.mp4`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      success('Video descargado exitosamente')
    } catch (err) {
      error('Error al descargar el video')
    } finally {
      setDownloadingVideo(false)
    }
  }

  const handleCopyLink = async () => {
    if (!videoData) return

    try {
      await navigator.clipboard.writeText(videoData.video_url)
      setCopiedLink(true)
      success('Enlace copiado al portapapeles')
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (err) {
      error('Error al copiar enlace')
    }
  }

  const handleBackToCreate = () => {
    router.push('/create')
  }

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <Header />
        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  if (!videoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <Header />
        <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-muted-foreground">No se encontraron datos del video</p>
            <Button onClick={handleBackToCreate} className="mt-4">
              Volver a Crear
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={handleBackToCreate}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Crear Nuevo Video
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                ¡Video Creado Exitosamente! 🎉
              </h1>
              <p className="text-muted-foreground">
                Tu video está listo para compartir en redes sociales
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Video Player */}
                <div className="relative bg-black rounded-t-lg overflow-hidden">
                  <video
                    src={videoData.video_url}
                    poster={videoData.thumbnail_url}
                    controls
                    className="w-full aspect-[9/16] max-h-[600px] object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    muted={isMuted}
                  >
                    Tu navegador no soporta el elemento video.
                  </video>

                  {/* Video Info Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {formatDuration(videoData.duration)}
                          </Badge>
                          <Badge variant="secondary" className="bg-white/20 text-white">
                            {formatFileSize(videoData.file_size)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMuted(!isMuted)}
                            className="text-white hover:bg-white/20"
                          >
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Video Details */}
                <div className="p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{videoData.metadata.title}</h3>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                      <span>{videoData.metadata.clips_count} clips utilizados</span>
                      <span>•</span>
                      <span>Audio de {videoData.metadata.audio_duration.toFixed(1)}s</span>
                      <span>•</span>
                      <span>Generado con IA</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleDownload}
                      disabled={downloadingVideo}
                      className="flex-1 min-w-[150px]"
                    >
                      {downloadingVideo ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Descargar Video
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      className="flex-1 min-w-[150px]"
                    >
                      {copiedLink ? (
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 mr-2" />
                      )}
                      {copiedLink ? 'Copiado' : 'Copiar Enlace'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Media Export */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Compartir en Redes Sociales
                </h3>

                <div className="space-y-3">
                  {/* TikTok */}
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 hover:bg-black hover:text-white"
                    onClick={() => success('Funcionalidad de TikTok en desarrollo')}
                  >
                    <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">TT</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">TikTok</div>
                      <div className="text-xs text-muted-foreground">Formato vertical optimizado</div>
                    </div>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </Button>

                  {/* YouTube */}
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 hover:bg-red-600 hover:text-white"
                    onClick={() => success('Funcionalidad de YouTube en desarrollo')}
                  >
                    <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">YT</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">YouTube Shorts</div>
                      <div className="text-xs text-muted-foreground">Subir como Short</div>
                    </div>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </Button>

                  {/* Instagram */}
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white"
                    onClick={() => success('Funcionalidad de Instagram en desarrollo')}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">IG</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Instagram Reels</div>
                      <div className="text-xs text-muted-foreground">Compartir como Reel</div>
                    </div>
                    <ExternalLink className="w-4 h-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Video Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Estadísticas del Video</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Duración:</span>
                    <Badge variant="secondary">{formatDuration(videoData.duration)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tamaño:</span>
                    <Badge variant="secondary">{formatFileSize(videoData.file_size)}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Clips:</span>
                    <Badge variant="secondary">{videoData.metadata.clips_count}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Formato:</span>
                    <Badge variant="secondary">MP4 (9:16)</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">💡 Tips para Redes Sociales</h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Sube tu video en horarios de mayor actividad (7-9 PM)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Usa hashtags relevantes para tu nicho</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span>Los primeros 3 segundos son cruciales para captar atención</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}