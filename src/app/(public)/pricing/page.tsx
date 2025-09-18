'use client'

import { useState } from 'react'
import { Header } from '@/components/common/header/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PRICING_PLANS, type PricingPlan } from '@/lib/data/pricing'
import { useSubscription } from '@/hooks/subscription'
import {
  CheckCircle,
  Crown,
  Zap,
  Clock,
  Users,
  TrendingUp,
  ArrowRight,
  Calculator,
  Star,
  Play
} from 'lucide-react'

const ROI_CALCULATOR = {
  hoursPerVideo: 3,
  hourlyRate: 25, // €/hour
  videosPerMonth: 10,
  traditionaCost: 75, // €25/hour * 3 hours
  shortsAICost: 0.5 // Estimated cost per video with AI
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const { subscription, createCheckoutSession, manageBilling } = useSubscription()

  const handleUpgrade = async (plan: PricingPlan) => {
    if (loading) return

    setLoading(plan.id)

    try {
      if (plan.id === 'free') {
        // Redirect to register/login for free plan
        window.location.href = '/register'
      } else if (plan.id === 'enterprise') {
        // Contact sales
        window.location.href = 'mailto:sales@shortsai.com?subject=Enterprise Plan Inquiry'
      } else if (plan.stripePriceId) {
        // Create Stripe checkout session
        await createCheckoutSession(plan.id, false)
      }
    } catch (error) {
      console.error('Error upgrading plan:', error)
    } finally {
      setLoading(null)
    }
  }

  const calculateROI = () => {
    const traditionalMonthlyCost = ROI_CALCULATOR.traditionaCost * ROI_CALCULATOR.videosPerMonth
    const aiMonthlyCost = ROI_CALCULATOR.shortsAICost * ROI_CALCULATOR.videosPerMonth + 29 // Pro plan
    const savings = traditionalMonthlyCost - aiMonthlyCost
    const timesSaved = ROI_CALCULATOR.hoursPerVideo * ROI_CALCULATOR.videosPerMonth

    return {
      traditionalCost: traditionalMonthlyCost,
      aiCost: aiMonthlyCost,
      savings: savings,
      timesSaved: timesSaved,
      roi: Math.round((savings / aiMonthlyCost) * 100)
    }
  }

  const roi = calculateROI()

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-6">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
              <Crown className="w-4 h-4" />
              Planes diseñados para creators
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Escala tu Contenido
            </span>
            <br />
            <span className="text-foreground">sin Escalar tu Equipo</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Desde creators individuales hasta agencias globales.
            <strong className="text-foreground"> Ahorra hasta 95% del tiempo</strong> de
            producción con nuestra IA.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Mensual
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`
                relative w-12 h-6 rounded-full transition-colors duration-200
                ${isAnnual ? 'bg-primary' : 'bg-muted'}
              `}
            >
              <div className={`
                absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200
                ${isAnnual ? 'translate-x-6' : 'translate-x-0.5'}
              `} />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Anual
            </span>
            {isAnnual && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                Ahorra 20%
              </span>
            )}
          </div>
        </div>

        {/* ROI Calculator Section */}
        <Card className="mb-12 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <Calculator className="w-6 h-6 text-primary" />
                Calculadora de ROI
              </h2>
              <p className="text-muted-foreground">
                Descubre cuánto puedes ahorrar con ShortsAI
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-red-600 mb-2">€{roi.traditionalCost}</div>
                <div className="text-sm text-muted-foreground">Costo tradicional/mes</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {ROI_CALCULATOR.videosPerMonth} videos × {ROI_CALCULATOR.hoursPerVideo}h × €{ROI_CALCULATOR.hourlyRate}/h
                </div>
              </div>

              <div>
                <div className="text-3xl font-bold text-green-600 mb-2">€{roi.aiCost}</div>
                <div className="text-sm text-muted-foreground">Con ShortsAI Pro</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Plan Pro + costos de generación
                </div>
              </div>

              <div>
                <div className="text-3xl font-bold text-primary mb-2">{roi.roi}%</div>
                <div className="text-sm text-muted-foreground">ROI en el primer mes</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Ahorras €{roi.savings} y {roi.timesSaved}h/mes
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {PRICING_PLANS.map((plan) => {
            const price = isAnnual && plan.price !== 0
              ? Math.round(plan.yearlyPrice / 12)
              : plan.price

            const displayPrice = plan.price === 0 ? '€0' : `€${price}`

            return (
              <Card key={plan.id} className={`
                relative transition-all duration-300 hover:shadow-xl
                ${plan.popular ? 'ring-2 ring-primary scale-105 bg-gradient-to-br from-primary/5 to-secondary/5' : 'hover:shadow-lg'}
                ${subscription?.plan_id === plan.id ? 'ring-2 ring-green-500' : ''}
              `}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary to-secondary text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Más Popular
                    </span>
                  </div>
                )}

                {subscription?.plan_id === plan.id && (
                  <div className="absolute -top-4 right-4">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Plan Actual
                    </span>
                  </div>
                )}

                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-3xl font-bold">{displayPrice}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    {isAnnual && plan.price !== 0 && (
                      <div className="text-xs text-green-600 font-medium">
                        Ahorra €{Math.round(plan.price * 12 * 0.2)}/año
                      </div>
                    )}
                    <p className="text-muted-foreground text-sm mt-2">{plan.description}</p>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleUpgrade(plan)}
                    disabled={loading === plan.id || subscription?.plan_id === plan.id}
                    className={`
                      w-full transition-all duration-200
                      ${plan.popular
                        ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white'
                        : subscription?.plan_id === plan.id
                        ? 'bg-green-500 text-white'
                        : 'bg-card hover:bg-muted'
                      }
                    `}
                  >
                    {loading === plan.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Procesando...
                      </>
                    ) : subscription?.plan_id === plan.id ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Plan Actual
                      </>
                    ) : (
                      <>
                        {plan.cta}
                        {plan.id !== 'enterprise' && <ArrowRight className="w-4 h-4 ml-2" />}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {[
            { icon: Play, value: '2M+', label: 'Videos Generados' },
            { icon: Users, value: '50K+', label: 'Creators Activos' },
            { icon: Clock, value: '95%', label: 'Tiempo Ahorrado' },
            { icon: TrendingUp, value: '10x', label: 'Mejor Engagement' }
          ].map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </div>
            )
          })}
        </div>

        {/* Testimonials */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Lo que Dicen Nuestros Creators
            </span>
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: 'María García',
                role: 'Content Creator',
                avatar: '👩‍💼',
                content: 'El plan Pro me devolvió la inversión en 2 semanas. Increíble ROI.',
                plan: 'Plan Pro'
              },
              {
                name: 'Carlos Rodríguez',
                role: 'Tech YouTuber',
                avatar: '👨‍💻',
                content: 'Desde el plan Creador, he triplicado mi producción de contenido.',
                plan: 'Plan Creador'
              },
              {
                name: 'Ana López',
                role: 'Marketing Agency',
                avatar: '👩‍🎨',
                content: 'El plan Agencia nos permitió escalar sin contratar más personal.',
                plan: 'Plan Agencia'
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-muted-foreground mb-6 italic">
                    &quot;{testimonial.content}&quot;
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center text-lg">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                      {testimonial.plan}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            Preguntas Frecuentes
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                question: '¿Puedo cambiar de plan en cualquier momento?',
                answer: 'Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu configuración de cuenta.'
              },
              {
                question: '¿Hay límites en la resolución de video?',
                answer: 'El plan gratuito incluye 720p, Creador 1080p, Pro 4K, y Agencia resolución personalizada.'
              },
              {
                question: '¿Qué incluye el soporte prioritario?',
                answer: 'Respuesta en menos de 2 horas, chat directo con desarrolladores y acceso a nuevas features.'
              },
              {
                question: '¿Ofrecen descuentos para estudiantes?',
                answer: 'Sí, ofrecemos 50% de descuento para estudiantes con email .edu válido.'
              }
            ].map((faq, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3">{faq.question}</h3>
                  <p className="text-muted-foreground text-sm">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Manage Subscription Section */}
        {subscription && (
          <Card className="mb-8 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Gestionar Suscripción</h3>
              <p className="text-muted-foreground mb-4">
                Tienes el plan <strong>{subscription.plan_id}</strong> activo.
                {subscription.is_annual ? ' Facturación anual.' : ' Facturación mensual.'}
              </p>
              <Button
                onClick={manageBilling}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                Gestionar Facturación
              </Button>
            </CardContent>
          </Card>
        )}

        {/* CTA Section */}
        <Card className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                ¿Listo para Escalar?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-6">
              Únete a más de 50,000 creators que ya están automatizando su contenido
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-4 text-lg"
              >
                <Zap className="w-5 h-5 mr-2" />
                Empezar Gratis
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                Hablar con Ventas
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}