import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, Crown, Rocket, ArrowUpRight } from 'lucide-react'
import { useCredits } from './creditsManager'
import { useAuth } from '@/hooks/auth/AuthContext'
import Link from 'next/link'

const TIER_CONFIG = {
  free: {
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
  },
  pro: {
    icon: Crown,
    color: 'from-purple-500 to-pink-500',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
  },
  enterprise: {
    icon: Rocket,
    color: 'from-amber-500 to-orange-500',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
  }
}

export function CreditsCard() {
  const { user } = useAuth()
  const { creditStatus, loading } = useCredits(user?.id)

  if (loading || !creditStatus) {
    return (
      <Card className="card-glow">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-2/3"></div>
            <div className="h-2 bg-muted rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const config = TIER_CONFIG[creditStatus.tier]
  const Icon = config.icon
  const progressPercentage = (creditStatus.used / creditStatus.limit) * 100
  


  return (
    <Card className="card-glow relative overflow-hidden">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${config.color} opacity-5`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${config.color} flex items-center justify-center`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Videos Disponibles</CardTitle>
              <CardDescription>Plan {creditStatus.tier.charAt(0).toUpperCase() + creditStatus.tier.slice(1)}</CardDescription>
            </div>
          </div>
          <Badge className={config.badgeColor}>
            {creditStatus.tier.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Usage Stats */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {creditStatus.used} de {creditStatus.limit} usados
            </span>
            <span className="text-sm text-muted-foreground">
              {creditStatus.remaining} restantes
            </span>
          </div>
          
          <Progress 
            value={progressPercentage} 
            className="h-2"
          />
        </div>

        {/* Status Message */}
        <div className="text-sm">
          {creditStatus.remaining === 0 ? (
            <div className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              Has alcanzado tu límite mensual
            </div>
          ) : creditStatus.remaining <= 2 ? (
            <div className="text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
              Quedan pocos videos disponibles
            </div>
          ) : (
            <div className="text-green-600 dark:text-green-400 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              Listo para crear contenido
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        {(creditStatus.tier === 'free' || creditStatus.remaining <= 5) && (
          <Button asChild className="w-full" size="sm">
            <Link href="/pricing" className="flex items-center gap-2">
              {creditStatus.tier === 'free' ? 'Upgrade Plan' : 'Comprar más créditos'}
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Button>
        )}

        {/* Reset Info */}
        <p className="text-xs text-muted-foreground text-center">
          Los créditos se renuevan cada mes
        </p>
      </CardContent>
    </Card>
  )
}