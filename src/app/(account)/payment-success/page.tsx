'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/common/header/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  CheckCircle,
  Sparkles,
  Crown,
  Zap,
  Video,
  TrendingUp,
  ArrowRight,
  Gift,
  Star,
  Rocket
} from 'lucide-react'

interface PaymentDetails {
  planId: string
  planName: string
  isAnnual: boolean
  amount: string
  features: string[]
  icon: any
  color: string
  credits: number
  currency?: string
}

const PLAN_ICONS: Record<string, { icon: any; color: string }> = {
  starter: {
    icon: Zap,
    color: 'from-blue-500 to-cyan-500'
  },
  pro: {
    icon: Crown,
    color: 'from-purple-500 to-pink-500'
  },
  enterprise: {
    icon: Rocket,
    color: 'from-amber-500 to-orange-500'
  }
}

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const sessionId = searchParams.get('session_id')
  const planId = searchParams.get('plan') || 'pro'

  useEffect(() => {
    if (!sessionId) {
      router.push('/dashboard')
      return
    }

    // Verificar pago con Stripe
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payment/verify?session_id=${sessionId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to verify payment')
        }

        // Obtener icono y color del plan
        const planConfig = PLAN_ICONS[data.planId] || PLAN_ICONS.pro

        // Crear objeto de detalles del pago
        const details: PaymentDetails = {
          planId: data.planId,
          planName: data.planName,
          isAnnual: data.isAnnual,
          amount: `${data.currency} ${data.amount}`,
          features: data.features,
          icon: planConfig.icon,
          color: planConfig.color,
          credits: data.credits,
          currency: data.currency
        }

        setPaymentDetails(details)
        setIsLoading(false)
        setShowConfetti(true)

        // Ocultar confetti después de 3 segundos
        setTimeout(() => setShowConfetti(false), 3000)

      } catch (error) {
        console.error('Error verifying payment:', error)
        // En caso de error, redirigir al dashboard
        router.push('/dashboard?error=payment_verification_failed')
      }
    }

    verifyPayment()
  }, [sessionId, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Verificando tu pago...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 pt-32">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error al verificar el pago</h1>
            <Link href="/dashboard">
              <Button>Ir al Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const PlanIcon = paymentDetails.icon

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className={`absolute w-3 h-3 opacity-80 animate-bounce`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                backgroundColor: ['#FF6B35', '#F7931E', '#00D9FF', '#00C896'][Math.floor(Math.random() * 4)]
              }}
            />
          ))}
        </div>
      )}

      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/10 rounded-full blur-3xl"></div>

      <Header />

      <div className="container mx-auto px-4 pt-32 pb-16 relative z-10">
        {/* Success Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full mb-6 animate-pulse">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
            ¡Felicidades! 🎉
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-2">
            Has ascendido a <span className="font-semibold text-foreground">{paymentDetails.planName}</span>
          </p>

          <p className="text-lg text-muted-foreground">
            Tu suscripción está activa y lista para usar
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-12">
          {/* Plan Details Card */}
          <Card className="relative overflow-hidden border-2 border-primary/20">
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${paymentDetails.color}`}></div>
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-2xl bg-gradient-to-r ${paymentDetails.color}`}>
                  <PlanIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{paymentDetails.planName}</h2>
                  <p className="text-muted-foreground">Plan activado</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">Créditos mensuales</span>
                  <span className="text-xl font-bold text-primary">{paymentDetails.credits}</span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold mb-3">Características incluidas:</h3>
                  {paymentDetails.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardContent className="p-8">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                ¿Qué puedes hacer ahora?
              </h2>

              <div className="space-y-4">
                <Link href="/create" className="block">
                  <div className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Video className="w-6 h-6 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold">Crear tu primer video</h3>
                        <p className="text-sm text-muted-foreground">Comienza a generar contenido viral ahora</p>
                      </div>
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>

                <Link href="/templates" className="block">
                  <div className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Crown className="w-6 h-6 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold">Explorar templates premium</h3>
                        <p className="text-sm text-muted-foreground">Accede a todos los templates profesionales</p>
                      </div>
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>

                <Link href="/analytics" className="block">
                  <div className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-6 h-6 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold">Ver analytics</h3>
                        <p className="text-sm text-muted-foreground">Analiza el rendimiento de tus videos</p>
                      </div>
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t">
                <Link href="/dashboard">
                  <Button className="w-full btn-primary" size="lg">
                    <Gift className="w-5 h-5 mr-2" />
                    Ir al Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Special Offer/Tips Section */}
        <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <Star className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-4">¡Bonus de bienvenida!</h2>
            <p className="text-muted-foreground mb-6">
              Como nuevo suscriptor {paymentDetails.planName}, recibirás un bonus de
              <span className="font-semibold text-foreground"> {Math.floor(paymentDetails.credits * 0.2)} créditos extra </span>
              este mes para que pruebes todas las funcionalidades.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Sin compromisos
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Cancela cuando quieras
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            ¿Tienes alguna pregunta sobre tu nueva suscripción?
          </p>
          <Button variant="outline" asChild>
            <Link href="/help">
              Contactar Soporte
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}