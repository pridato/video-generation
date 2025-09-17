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
            ¿Listo para crear YouTube Shorts virales con IA?
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Videos Created</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">12</div>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>
          
          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">24.8K</div>
              <p className="text-xs text-muted-foreground">+18% from last week</p>
            </CardContent>
          </Card>
          
          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credits Left</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">5</div>
              <p className="text-xs text-muted-foreground">Resets in 12 days</p>
            </CardContent>
          </Card>
          
          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">45s</div>
              <p className="text-xs text-muted-foreground">Perfect for Shorts</p>
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
                {/* Sample video items */}
                <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">React Hooks Explained</p>
                    <p className="text-xs text-muted-foreground">2 days ago • 1.2K views</p>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-primary/20 rounded-lg flex items-center justify-center">
                    <Play className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">5 JavaScript Tips</p>
                    <p className="text-xs text-muted-foreground">1 week ago • 3.8K views</p>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Share2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 border border-dashed border-border rounded-lg opacity-50">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-muted-foreground ai-working" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">AI Video Processing...</p>
                    <p className="text-xs text-muted-foreground">Est. 2 min remaining</p>
                  </div>
                </div>

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