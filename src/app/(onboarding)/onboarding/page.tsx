'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Play,
  Users,
  TrendingUp,
  BookOpen,
  Code,
  Mic,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Wand2
} from 'lucide-react'

const CONTENT_TYPES = [
  {
    id: 'tech',
    name: 'Tutoriales Tech',
    description: 'Explicaciones de código, frameworks y herramientas',
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    example: 'Cómo crear tu primera app React en 10 minutos'
  },
  {
    id: 'education',
    name: 'Contenido Educativo',
    description: 'Explicaciones didácticas y material formativo',
    icon: BookOpen,
    color: 'from-green-500 to-emerald-500',
    example: 'Los 5 principios fundamentales del marketing digital'
  },
  {
    id: 'entertainment',
    name: 'Entretenimiento',
    description: 'Datos curiosos, trivia y contenido viral',
    icon: TrendingUp,
    color: 'from-purple-500 to-pink-500',
    example: '10 datos sorprendentes sobre el espacio que no conocías'
  },
  {
    id: 'business',
    name: 'Business & Emprendimiento',
    description: 'Consejos empresariales y de productividad',
    icon: Users,
    color: 'from-orange-500 to-red-500',
    example: 'Cómo aumentar tu productividad en 30 días'
  }
]

const EXAMPLE_PROMPTS = {
  tech: [
    'Explica qué son los React Hooks y cómo usar useState',
    'Tutorial básico de Git para principiantes',
    'Diferencias entre TypeScript y JavaScript',
    'Cómo optimizar el rendimiento de una aplicación web'
  ],
  education: [
    'Los 5 errores más comunes al aprender programación',
    'Técnicas de estudio efectivas para desarrolladores',
    'Cómo funciona el algoritmo de YouTube',
    'Principios básicos de UX/UI design'
  ],
  entertainment: [
    '10 datos increíbles sobre la inteligencia artificial',
    'Curiosidades del mundo de la programación',
    'Los lenguajes de programación más raros que existen',
    'Mitos vs realidad sobre ser programador'
  ],
  business: [
    'Cómo monetizar tu canal de programación',
    '5 habilidades que todo developer freelance necesita',
    'Estrategias para hacer crecer tu audiencia tech',
    'De junior a senior: guía completa'
  ]
}

const TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimalista',
    description: 'Diseño limpio y profesional',
    preview: '🎯',
    color: 'from-gray-500 to-slate-600'
  },
  {
    id: 'dynamic',
    name: 'Dinámico',
    description: 'Animaciones y transiciones llamativas',
    preview: '⚡',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'colorful',
    name: 'Colorido',
    description: 'Vibrante y energético',
    preview: '🌈',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Elegante tema oscuro',
    preview: '🌙',
    color: 'from-gray-800 to-black'
  }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null)
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const progress = (currentStep / 3) * 100

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = async () => {
    setIsGenerating(true)

    // Simulate video generation
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Redirect to dashboard
    router.push('/dashboard?onboarding=completed')
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedContentType !== null
      case 2:
        return selectedPrompt !== null
      case 3:
        return selectedTemplate !== null
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-white" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold mb-2">
            Bienvenido a <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">ShortsAI</span>
          </h1>
          <p className="text-muted-foreground">
            Vamos a crear tu primer video en 3 sencillos pasos
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                  ${currentStep >= step
                    ? 'bg-primary text-white'
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {currentStep > step ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 3 && (
                  <div className={`
                    w-full h-0.5 mx-4 transition-colors duration-300
                    ${currentStep > step ? 'bg-primary' : 'bg-muted'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="card-glow border-0 shadow-2xl">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">¿Qué tipo de contenido creas?</h2>
                  <p className="text-muted-foreground">
                    Esto nos ayudará a personalizar tu experiencia
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {CONTENT_TYPES.map((type) => {
                    const Icon = type.icon
                    return (
                      <div
                        key={type.id}
                        onClick={() => setSelectedContentType(type.id)}
                        className={`
                          p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg
                          ${selectedContentType === type.id
                            ? 'border-primary bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg'
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{type.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                            <p className="text-xs text-primary font-medium">{type.example}</p>
                          </div>
                        </div>

                        {selectedContentType === type.id && (
                          <div className="mt-4 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-primary" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {currentStep === 2 && selectedContentType && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Prueba con este ejemplo</h2>
                  <p className="text-muted-foreground">
                    Selecciona un prompt para generar tu primer video
                  </p>
                </div>

                <div className="space-y-4">
                  {EXAMPLE_PROMPTS[selectedContentType as keyof typeof EXAMPLE_PROMPTS].map((prompt, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedPrompt(prompt)}
                      className={`
                        p-4 border-2 rounded-xl cursor-pointer transition-all duration-300
                        ${selectedPrompt === prompt
                          ? 'border-primary bg-gradient-to-br from-primary/10 to-secondary/10'
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{prompt}</p>
                        {selectedPrompt === prompt && (
                          <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 ml-4" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">IA Enhancement</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Nuestro GPT-4 optimizará automáticamente tu guión para máximo engagement
                  </p>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold mb-2">Personaliza tu template</h2>
                  <p className="text-muted-foreground">
                    Elige el estilo visual que mejor represente tu marca
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`
                        p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-lg
                        ${selectedTemplate === template.id
                          ? 'border-primary bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg'
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                    >
                      <div className="text-center">
                        <div className={`w-16 h-16 bg-gradient-to-br ${template.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl`}>
                          {template.preview}
                        </div>
                        <h3 className="font-semibold mb-2">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>

                      {selectedTemplate === template.id && (
                        <div className="mt-4 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className={currentStep === 1 ? 'invisible' : ''}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Paso {currentStep} de 3
                </p>
              </div>

              {currentStep < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="btn-primary"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={!canProceed() || isGenerating}
                  className="btn-primary px-8"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Crear mi Primer Video
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skip option */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Saltar onboarding
          </button>
        </div>
      </div>
    </div>
  )
}