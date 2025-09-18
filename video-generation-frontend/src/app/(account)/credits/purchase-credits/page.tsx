'use client'

import { useState } from 'react'
import { Header } from '@/components/common/header/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSubscription } from '@/hooks/subscription'
import {
  CreditCard,
  Zap,
  Star,
  Crown,
  Check,
  Sparkles,
  ArrowRight,
  Gift
} from 'lucide-react'

const CREDIT_PACKAGES = [
  {
    id: '10',
    amount: 10,
    price: 5,
    originalPrice: 6,
    discount: 0,
    popular: false,
    description: 'Perfecto para probar',
    features: [
      '10 videos generados',
      'Todas las plantillas',
      'Calidad HD',
      'Soporte básico'
    ]
  },
  {
    id: '25',
    amount: 25,
    price: 10,
    originalPrice: 15,
    discount: 33,
    popular: true,
    description: 'Más popular para creators',
    features: [
      '25 videos generados',
      'Todas las plantillas',
      'Calidad HD + 4K',
      'Voces premium',
      'Soporte prioritario'
    ]
  },
  {
    id: '50',
    amount: 50,
    price: 18,
    originalPrice: 30,
    discount: 40,
    popular: false,
    description: 'Para uso intensivo',
    features: [
      '50 videos generados',
      'Todas las plantillas',
      'Calidad HD + 4K',
      'Voces premium',
      'Analytics básicos',
      'Soporte prioritario'
    ]
  },
  {
    id: '100',
    amount: 100,
    price: 30,
    originalPrice: 60,
    discount: 50,
    popular: false,
    description: 'Para equipos y agencias',
    features: [
      '100 videos generados',
      'Todas las plantillas',
      'Calidad HD + 4K',
      'Voces premium',
      'Analytics completos',
      'API access',
      'Soporte dedicado'
    ]
  }
]

export default function CreditsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const { user, getCredits } = useSubscription()

  const handlePurchaseCredits = async (packageId: string) => {
    if (!user || loading) return

    setLoading(packageId)

    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits: packageId,
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create purchase session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Error purchasing credits:', error)
    } finally {
      setLoading(null)
    }
  }

  const currentCredits = getCredits()

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4" />
              Compra créditos para generar más videos
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Potencia tu Creatividad
            </span>
            <br />
            <span className="text-foreground">con Créditos Adicionales</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Cada crédito = 1 video generado. Sin límites, sin suscripciones.
            <strong className="text-foreground"> Paga solo por lo que uses.</strong>
          </p>

          {/* Current Credits Display */}
          {user && (
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl px-6 py-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">Créditos actuales</p>
                <p className="text-2xl font-bold text-primary">{currentCredits}</p>
              </div>
            </div>
          )}
        </div>

        {/* Credit Packages */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {CREDIT_PACKAGES.map((package_item) => (
            <Card key={package_item.id} className={`
              relative transition-all duration-300 hover:shadow-xl
              ${package_item.popular ? 'ring-2 ring-primary scale-105 bg-gradient-to-br from-primary/5 to-secondary/5' : 'hover:shadow-lg'}
            `}>
              {package_item.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    Más Popular
                  </span>
                </div>
              )}

              {package_item.discount > 0 && (
                <div className="absolute -top-2 -right-2">
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    -{package_item.discount}%
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br ${
                  package_item.popular ? 'from-primary to-secondary' : 'from-muted to-muted/50'
                }`}>
                  <div className="text-2xl font-bold text-white">
                    {package_item.amount}
                  </div>
                </div>

                <CardTitle className="text-xl">{package_item.amount} Créditos</CardTitle>
                <p className="text-muted-foreground text-sm">{package_item.description}</p>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl font-bold">€{package_item.price}</span>
                    {package_item.discount > 0 && (
                      <span className="text-lg text-muted-foreground line-through">
                        €{package_item.originalPrice}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    €{(package_item.price / package_item.amount).toFixed(2)} por crédito
                  </p>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-6">
                  {package_item.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePurchaseCredits(package_item.id)}
                  disabled={loading === package_item.id || !user}
                  className={`
                    w-full transition-all duration-200
                    ${package_item.popular
                      ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white'
                      : 'bg-card hover:bg-muted'
                    }
                  `}
                >
                  {loading === package_item.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Comprar Ahora
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 mb-12">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <Gift className="w-6 h-6 text-primary" />
                ¿Por qué comprar créditos?
              </h2>
              <p className="text-muted-foreground">
                Máxima flexibilidad para tu creación de contenido
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold mb-2">Sin Compromisos</h3>
                <p className="text-sm text-muted-foreground">
                  No necesitas suscripción mensual. Compra solo cuando necesites crear más videos.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-2">Mejor Precio</h3>
                <p className="text-sm text-muted-foreground">
                  Descuentos de hasta 50% en paquetes grandes. Más créditos = mayor ahorro.
                </p>
              </div>

              <div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Crown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-2">Sin Expiración</h3>
                <p className="text-sm text-muted-foreground">
                  Tus créditos nunca expiran. Úsalos cuando quieras, a tu ritmo.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">¿Necesitas ayuda?</h3>
          <p className="text-muted-foreground mb-6">
            Nuestro equipo está disponible para resolver cualquier duda sobre créditos
          </p>
          <Button variant="outline" className="gap-2">
            Contactar Soporte
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  )
}