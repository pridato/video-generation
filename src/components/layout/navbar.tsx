'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Play, BarChart3, DollarSign, User, LogOut, Sparkles, Plus, Video, Settings } from 'lucide-react'

export function Navbar() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push(ROUTES.HOME)
  }

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href={ROUTES.HOME} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Play className="w-4 h-4 text-white" fill="currentColor" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ShortsAI
              </span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              href={ROUTES.CREATE}
              className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-2 rounded-lg hover:bg-primary/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Crear</span>
            </Link>
            <Link 
              href={ROUTES.DASHBOARD}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link 
              href={ROUTES.LIBRARY}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Video className="w-4 h-4" />
              <span className="hidden sm:inline">Biblioteca</span>
            </Link>
            <Link 
              href={ROUTES.SETTINGS}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Configuración</span>
            </Link>
            <Link 
              href={ROUTES.PRICING}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">Precios</span>
            </Link>
            
            {/* Credits indicator */}
            <div className="hidden sm:flex items-center space-x-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-sm">
              <Sparkles className="w-3 h-3" />
              <span>5 credits</span>
            </div>
            
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
