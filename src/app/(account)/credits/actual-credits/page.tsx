'use client'

import { useState } from 'react'
import { Header } from '@/components/common/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CreditsCard } from '@/lib/services/credits/CreditsCard'
import { useAuth } from '@/hooks/auth/AuthContext'
import { useCredits } from '@/lib/services/credits/creditsManager'
import {
  History,
  Plus,
  Video,
  Calendar,
  TrendingUp,
  Clock,
  Download,
  Eye,
  BarChart3,
  Zap,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { PLAN_BENEFITS, CREDIT_HISTORY } from '@/lib/data/credits'

export default function ActualCreditsPage() {
  const { user } = useAuth()
  const { creditStatus,  } = useCredits(user?.id)
  const [activeTab, setActiveTab] = useState('overview')

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'used':
        return <Video className="w-4 h-4 text-red-500" />
      case 'purchase':
        return <Plus className="w-4 h-4 text-green-500" />
      case 'bonus':
        return <TrendingUp className="w-4 h-4 text-blue-500" />
      case 'renewal':
        return <Calendar className="w-4 h-4 text-purple-500" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'used':
        return 'text-red-600 dark:text-red-400'
      case 'purchase':
      case 'bonus':
      case 'renewal':
        return 'text-green-600 dark:text-green-400'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Créditos</h1>
          <p className="text-muted-foreground mt-2">
            Monitorea tu uso de créditos y gestiona tu plan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Credits Card - Columna principal */}
          <div className="lg:col-span-1">
            <CreditsCard />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Resumen</TabsTrigger>
                <TabsTrigger value="history">Historial</TabsTrigger>
                <TabsTrigger value="plans">Planes</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Usage This Month */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Uso este mes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {creditStatus?.used || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        videos generados
                      </p>
                    </CardContent>
                  </Card>

                  {/* Credits Remaining */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Créditos restantes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {creditStatus?.remaining || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        de {creditStatus?.limit || 0} disponibles
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Acciones Rápidas</CardTitle>
                    <CardDescription>
                      Gestiona tus créditos y contenido
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button asChild className="justify-start">
                        <Link href="/create" className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Crear Video
                        </Link>
                      </Button>
                      
                      <Button variant="outline" asChild className="justify-start">
                        <Link href="/pricing" className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          Comprar Créditos
                        </Link>
                      </Button>
                      
                      <Button variant="outline" asChild className="justify-start">
                        <Link href="/library" className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Ver Biblioteca
                        </Link>
                      </Button>
                      
                      <Button variant="outline" asChild className="justify-start">
                        <Link href="/settings" className="flex items-center gap-2">
                          <Download className="w-4 h-4" />
                          Configuración
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Historial de Créditos
                    </CardTitle>
                    <CardDescription>
                      Registro completo de uso y recargas de créditos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {CREDIT_HISTORY.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            {getTypeIcon(item.type)}
                            <div>
                              <p className="font-medium text-sm">{item.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(item.date)}
                              </p>
                            </div>
                          </div>
                          <div className={`font-medium ${getTypeColor(item.type)}`}>
                            {item.amount > 0 ? '+' : ''}{item.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Plans Tab */}
              <TabsContent value="plans" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(PLAN_BENEFITS).map(([key, plan]) => {
                    const Icon = plan.icon
                    const isCurrentPlan = creditStatus?.tier === key
                    
                    return (
                      <Card key={key} className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
                        {isCurrentPlan && (
                          <Badge className="absolute -top-2 left-4 bg-primary">
                            Plan Actual
                          </Badge>
                        )}
                        <CardHeader className="text-center pb-3">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                          <CardDescription className="text-2xl font-bold">
                            {plan.credits} créditos/mes
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <ul className="space-y-2">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          
                          {!isCurrentPlan && (
                            <Button asChild className="w-full" size="sm">
                              <Link href="/pricing" className="flex items-center gap-2">
                                Cambiar Plan
                                <ArrowRight className="w-4 h-4" />
                              </Link>
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}