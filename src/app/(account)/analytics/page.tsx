'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useSubscription } from '@/hooks/subscription'
import {
  TrendingUp,
  Eye,
  Share2,
  Clock,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  PlayCircle,
  Heart,
  ExternalLink,
  Crown,
  Filter,
  RefreshCw,
  Sparkles
} from 'lucide-react'
import { useAuth } from '@/hooks/auth'

// Mock analytics data - in real app this would come from API
const ANALYTICS_DATA = {
  overview: {
    totalViews: 2847569,
    totalLikes: 145832,
    totalShares: 23467,
    totalComments: 8934,
    avgWatchTime: 42.3,
    totalVideos: 156,
    subscribersGained: 5234,
    revenue: 1847.32
  },
  videos: [
    {
      id: '1',
      title: 'Cómo crear tu primera app React en 10 minutos',
      thumbnail: '/api/placeholder/400/225',
      views: 458923,
      likes: 23847,
      shares: 3245,
      comments: 1834,
      watchTime: 8.7,
      revenue: 234.56,
      publishedAt: '2024-01-15',
      performance: 'excellent',
      impressions: 892456,
      clickRate: 12.4
    },
    {
      id: '2',
      title: 'Los 5 errores más comunes al aprender programación',
      thumbnail: '/api/placeholder/400/225',
      views: 324567,
      likes: 18934,
      shares: 2156,
      comments: 967,
      watchTime: 7.2,
      revenue: 156.78,
      publishedAt: '2024-01-10',
      performance: 'good',
      impressions: 654321,
      clickRate: 8.9
    },
    {
      id: '3',
      title: 'Técnicas de estudio efectivas para developers',
      thumbnail: '/api/placeholder/400/225',
      views: 198432,
      likes: 12567,
      shares: 1834,
      comments: 543,
      watchTime: 6.8,
      revenue: 98.45,
      publishedAt: '2024-01-05',
      performance: 'average',
      impressions: 432198,
      clickRate: 6.2
    }
  ],
  engagement: [
    { date: '2024-01-01', views: 12000, likes: 850, shares: 120 },
    { date: '2024-01-02', views: 15000, likes: 1200, shares: 180 },
    { date: '2024-01-03', views: 18000, likes: 1450, shares: 220 },
    { date: '2024-01-04', views: 22000, likes: 1800, shares: 290 },
    { date: '2024-01-05', views: 28000, likes: 2200, shares: 350 },
    { date: '2024-01-06', views: 25000, likes: 1950, shares: 310 },
    { date: '2024-01-07', views: 30000, likes: 2400, shares: 380 }
  ]
}

const PERFORMANCE_COLORS = {
  excellent: 'from-green-500 to-emerald-500',
  good: 'from-blue-500 to-cyan-500',
  average: 'from-yellow-500 to-orange-500',
  poor: 'from-red-500 to-pink-500'
}

const PERFORMANCE_ICONS = {
  excellent: ArrowUpRight,
  good: ArrowUpRight,
  average: ArrowDownRight,
  poor: ArrowDownRight
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { hasAccess, loading } = useSubscription()
  const [timeRange, setTimeRange] = useState('7d')
  const [selectedMetric, setSelectedMetric] = useState('views')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const {user, profile} = useAuth()

  useEffect(() => {
    if (typeof profile?.subscription_tier !== 'string') return
    if (!loading && !hasAccess('analytics', profile?.subscription_tier)) {
      router.push('/pricing?feature=analytics')
    }
  }, [hasAccess, loading, router, user, profile])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }


  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  const getPerformanceColor = (performance: string) => {
    return PERFORMANCE_COLORS[performance as keyof typeof PERFORMANCE_COLORS] || PERFORMANCE_COLORS.average
  }

  const PerformanceIcon = ({ performance }: { performance: string }) => {
    const Icon = PERFORMANCE_ICONS[performance as keyof typeof PERFORMANCE_ICONS] || ArrowDownRight
    return <Icon className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold">Analytics</h1>
              <div className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full">
                <Crown className="w-3 h-3 text-yellow-600" />
                <span className="text-xs font-medium text-yellow-700">PRO</span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Analiza el rendimiento de tus videos y optimiza tu estrategia de contenido
            </p>
          </div>

          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
              <Button
                variant={timeRange === '7d' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('7d')}
                className="text-xs"
              >
                7d
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('30d')}
                className="text-xs"
              >
                30d
              </Button>
              <Button
                variant={timeRange === '90d' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange('90d')}
                className="text-xs"
              >
                90d
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="card-glow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Visualizaciones</p>
                  <p className="text-2xl font-bold">{formatNumber(ANALYTICS_DATA.overview.totalViews)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">+12.5%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Me Gusta</p>
                  <p className="text-2xl font-bold">{formatNumber(ANALYTICS_DATA.overview.totalLikes)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">+8.3%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compartidos</p>
                  <p className="text-2xl font-bold">{formatNumber(ANALYTICS_DATA.overview.totalShares)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">+15.7%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tiempo Promedio</p>
                  <p className="text-2xl font-bold">{ANALYTICS_DATA.overview.avgWatchTime}s</p>
                  <div className="flex items-center gap-1 mt-1">
                    <ArrowUpRight className="w-3 h-3 text-green-500" />
                    <span className="text-xs text-green-500">+4.2%</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="card-glow border-0 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Engagement en el Tiempo
                </CardTitle>
                <div className="flex items-center gap-2">
                  {['views', 'likes', 'shares'].map((metric) => (
                    <Button
                      key={metric}
                      variant={selectedMetric === metric ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedMetric(metric)}
                      className="text-xs capitalize"
                    >
                      {metric === 'views' ? 'Vistas' : metric === 'likes' ? 'Likes' : 'Shares'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {ANALYTICS_DATA.engagement.map((day, index) => {
                  const value = day[selectedMetric as keyof typeof day] as number
                  const maxValue = Math.max(...ANALYTICS_DATA.engagement.map(d => d[selectedMetric as keyof typeof d] as number))
                  const height = (value / maxValue) * 100

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gradient-to-t from-primary to-secondary rounded-t-lg transition-all duration-500 ease-out opacity-80 hover:opacity-100"
                        style={{ height: `${height}%` }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {new Date(day.date).getDate()}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="card-glow border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Métricas Clave
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Retención Promedio</span>
                  <span className="text-sm text-muted-foreground">67%</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Click-Through Rate</span>
                  <span className="text-sm text-muted-foreground">9.2%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Engagement Rate</span>
                  <span className="text-sm text-muted-foreground">5.8%</span>
                </div>
                <Progress value={58} className="h-2" />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Ingresos Totales</span>
                  <span className="text-lg font-bold text-green-600">
                    €{ANALYTICS_DATA.overview.revenue.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Performance */}
        <Card className="card-glow border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Rendimiento de Videos
              </CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filtrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ANALYTICS_DATA.videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-center gap-4 p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="w-20 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{video.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(video.publishedAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{formatNumber(video.views)}</div>
                      <div className="text-muted-foreground">Vistas</div>
                    </div>

                    <div className="text-center">
                      <div className="font-medium">{formatNumber(video.likes)}</div>
                      <div className="text-muted-foreground">Likes</div>
                    </div>

                    <div className="text-center">
                      <div className="font-medium">{video.watchTime}s</div>
                      <div className="text-muted-foreground">Tiempo</div>
                    </div>

                    <div className="text-center">
                      <div className="font-medium text-green-600">€{video.revenue.toFixed(2)}</div>
                      <div className="text-muted-foreground">Ingresos</div>
                    </div>

                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r ${getPerformanceColor(video.performance)}/20`}>
                      <PerformanceIcon performance={video.performance} />
                      <span className="text-xs font-medium capitalize">{video.performance}</span>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="card-glow border-0 mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Insights de IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl">
                <h3 className="font-semibold mb-2 text-blue-700">🚀 Oportunidad de Crecimiento</h3>
                <p className="text-sm text-muted-foreground">
                  Tus videos sobre React tienen un 23% más engagement. Considera crear más contenido técnico para maximizar el alcance.
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                <h3 className="font-semibold mb-2 text-green-700">⏰ Mejor Horario</h3>
                <p className="text-sm text-muted-foreground">
                  Tus videos publicados entre 18:00-20:00 reciben un 31% más de visualizaciones. Programa tus próximas publicaciones en este horario.
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl">
                <h3 className="font-semibold mb-2 text-purple-700">📱 Optimización Móvil</h3>
                <p className="text-sm text-muted-foreground">
                  El 78% de tus visualizaciones vienen de móvil. Asegúrate de que tus títulos sean legibles en pantallas pequeñas.
                </p>
              </div>

              <div className="p-4 bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl">
                <h3 className="font-semibold mb-2 text-orange-700">🎯 Duración Óptima</h3>
                <p className="text-sm text-muted-foreground">
                  Videos de 45-60 segundos tienen la mejor retención (67%). Mantén este rango para maximizar el engagement.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}