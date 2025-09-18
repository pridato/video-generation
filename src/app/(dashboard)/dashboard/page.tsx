import { createClient } from '@/lib/services/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ROUTES } from '@/lib/constants'
import { Header } from '@/components/common/header/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Video, TrendingUp, Clock, Sparkles, Play, Download, Share2 } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await (await supabase).auth.getUser()

  if (!user) {
    redirect(ROUTES.AUTH.LOGIN)
  }

  // Obtener datos del perfil del usuario
  const { data: profile } = await (await supabase)
    .from('profiles')
    .select('monthly_videos_used, monthly_limit, total_videos_created, content_niche, target_audience, subscription_tier')
    .eq('id', user.id)
    .single()

  // Obtener videos recientes del usuario
  const { data: recentVideos } = await (await supabase)
    .from('videos')
    .select('id, title, status, created_at, video_url, analytics')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  // Calcular estadísticas básicas
  const totalViews = recentVideos?.reduce((acc, video) => {
    const views = video.analytics?.views || 0
    return acc + views
  }, 0) || 0

  const videosRemaining = profile ? profile.monthly_limit - profile.monthly_videos_used : 0
  const avgDuration = 45 // Placeholder, se puede calcular de los videos reales

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ¡Bienvenido de vuelta, Creator! 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            {profile?.content_niche ?
              `Especializado en ${profile.content_niche}. ¿Listo para crear contenido viral?` :
              '¿Listo para crear YouTube Shorts virales con IA?'
            }
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Videos Este Mes</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{profile?.monthly_videos_used || 0}</div>
              <p className="text-xs text-muted-foreground">de {profile?.monthly_limit || 5} disponibles</p>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Creados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{profile?.total_videos_created || 0}</div>
              <p className="text-xs text-muted-foreground">videos en total</p>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Videos Restantes</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{videosRemaining}</div>
              <p className="text-xs text-muted-foreground">
                {profile?.subscription_tier === 'enterprise' ? 'Ilimitados' : 'Se reinicia cada mes'}
              </p>
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plan Actual</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success capitalize">
                {profile?.subscription_tier || 'free'}
              </div>
              <p className="text-xs text-muted-foreground">
                {profile?.subscription_tier === 'free' ? 'Actualiza para más' : 'Plan premium activo'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create New Video */}
          <div className="lg:col-span-2">
            <Card className="card-glow border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  Create Your Next Viral Short
                </CardTitle>
                <CardDescription>
                  Transform your ideas into engaging YouTube Shorts with AI in minutes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer">
                    <h3 className="font-semibold mb-2">📚 Educational</h3>
                    <p className="text-sm text-muted-foreground">Tech tutorials, how-tos, explanations</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer">
                    <h3 className="font-semibold mb-2">🎬 Entertainment</h3>
                    <p className="text-sm text-muted-foreground">Viral facts, stories, comedy</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer">
                    <h3 className="font-semibold mb-2">💡 Lifestyle</h3>
                    <p className="text-sm text-muted-foreground">Tips, motivation, life hacks</p>
                  </div>
                  <div className="p-4 border rounded-lg hover:bg-accent/5 transition-colors cursor-pointer bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
                    <h3 className="font-semibold mb-2">⚡ Code to Video</h3>
                    <p className="text-sm text-muted-foreground">AI-powered code explanations</p>
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">PRO</span>
                  </div>
                </div>
                
                <Link href={ROUTES.CREATE}>
                  <Button className="w-full btn-primary" size="lg">
                    <Plus className="w-4 h-4 mr-2" />
                    Comenzar a Crear
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Videos */}
          <div>
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="text-lg">Recent Videos</CardTitle>
                <CardDescription>Your latest creations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Videos reales del usuario */}
                {recentVideos && recentVideos.length > 0 ? (
                  recentVideos.map((video) => {
                    const isProcessing = video.status === 'processing' || video.status === 'queued'
                    const views = video.analytics?.views || 0
                    const timeAgo = new Date(video.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short'
                    })

                    return (
                      <div key={video.id} className={`flex items-center space-x-3 p-3 border rounded-lg ${
                        isProcessing ? 'border-dashed opacity-50' : 'border-border'
                      }`}>
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                          {isProcessing ? (
                            <Clock className="w-4 h-4 text-muted-foreground animate-spin" />
                          ) : (
                            <Play className="w-4 h-4 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{video.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {isProcessing ? 'Procesando...' : `${timeAgo} • ${views} vistas`}
                          </p>
                        </div>
                        {!isProcessing && video.video_url && (
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <Share2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8">
                    <Video className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-2">Aún no has creado videos</p>
                    <Link href={ROUTES.CREATE}>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear tu primer video
                      </Button>
                    </Link>
                  </div>
                )}

                <Link href={ROUTES.LIBRARY}>
                  <Button variant="outline" className="w-full">
                    Ver Todos los Videos
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Tips */}
        <Card className="mt-8 card-glow border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Creator Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="text-2xl mb-2">🎯</div>
                <h3 className="font-semibold mb-1">Keep it Short</h3>
                <p className="text-sm text-muted-foreground">15-60 seconds works best for engagement</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl mb-2">🔥</div>
                <h3 className="font-semibold mb-1">Hook Early</h3>
                <p className="text-sm text-muted-foreground">Grab attention in the first 3 seconds</p>
              </div>
              <div className="text-center p-4">
                <div className="text-2xl mb-2">📈</div>
                <h3 className="font-semibold mb-1">Upload Consistently</h3>
                <p className="text-sm text-muted-foreground">Regular uploads boost algorithm performance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}