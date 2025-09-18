'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/common/header/header'
import { useAuth } from '@/hooks/auth'
import { useToast } from '@/hooks/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Play,
  Sparkles,
  Mic,
  Palette,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Wand2,
  FileText,
  Volume2,
  Clapperboard,
  Zap,
  Copy,
  RotateCcw,
  Crown
} from 'lucide-react'

// Step definitions
const STEPS = [
  { id: 1, name: 'Script', icon: FileText, description: 'Escribe tu guión' },
  { id: 2, name: 'IA Enhancement', icon: Sparkles, description: 'Mejora con IA' },
  { id: 3, name: 'Template', icon: Palette, description: 'Elige plantilla' },
  { id: 4, name: 'Voz', icon: Volume2, description: 'Selecciona voz' },
  { id: 5, name: 'Generar', icon: Clapperboard, description: 'Crear video' }
]

const TEMPLATES = [
  {
    id: 'tech-tutorial',
    name: 'Tutorial Tecnológico',
    description: 'Perfecto para tutoriales de código y explicaciones técnicas',
    preview: '🖥️',
    color: 'from-blue-500 to-cyan-500',
    isPremium: false
  },
  {
    id: 'viral-facts',
    name: 'Datos Virales',
    description: 'Formato atractivo para datos curiosos y trivia',
    preview: '🔥',
    color: 'from-orange-500 to-red-500',
    isPremium: false
  },
  {
    id: 'life-tips',
    name: 'Consejos de Vida',
    description: 'Contenido motivacional y de superación personal',
    preview: '💡',
    color: 'from-green-500 to-emerald-500',
    isPremium: false
  },
  {
    id: 'code-to-video',
    name: 'Código a Video',
    description: 'Convierte explicaciones de código en videos (IA)',
    preview: '⚡',
    color: 'from-purple-500 to-pink-500',
    isPremium: true
  }
]

const VOICES = [
  {
    id: 'spanish-male-1',
    name: 'Carlos',
    gender: 'Masculina',
    description: 'Voz profesional y clara',
    premium: false,
    preview: '/audio/carlos-preview.mp3'
  },
  {
    id: 'spanish-female-1',
    name: 'María',
    gender: 'Femenina',
    description: 'Tono cálido y amigable',
    premium: false,
    preview: '/audio/maria-preview.mp3'
  },
  {
    id: 'spanish-male-pro',
    name: 'Alejandro Pro',
    gender: 'Masculina',
    description: 'Voz de locutor profesional con IA',
    premium: true,
    preview: '/audio/alejandro-preview.mp3'
  },
  {
    id: 'spanish-female-pro',
    name: 'Sofia Pro',
    gender: 'Femenina',
    description: 'Voz ultra-realista con emoción',
    premium: true,
    preview: '/audio/sofia-preview.mp3'
  }
]

const SCRIPT_PLACEHOLDERS = [
  "Hoy voy a explicarte cómo crear tu primera aplicación en React paso a paso...",
  "¿Sabías que el 90% de los desarrolladores usan Git pero solo conocen 5 comandos?",
  "En este video te muestro el secreto que me permitió programar 10 veces más rápido...",
  "La inteligencia artificial está cambiando todo. Te explico por qué Python es clave..."
]

export default function CreatePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { success, error } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [script, setScript] = useState('')
  const [enhancedScript, setEnhancedScript] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleEnhanceScript = async () => {
    if (!script.trim()) return

    setIsEnhancing(true)
    // Simulate AI enhancement
    setTimeout(() => {
      setEnhancedScript(
        `${script}\n\n[IA Enhanced] - Estructura mejorada, hooks emocionales añadidos, timing optimizado para engagement máximo.`
      )
      setIsEnhancing(false)
      setCurrentStep(3) // Move to template selection
    }, 2500)
  }

  const handlePlayVoicePreview = (preview: string) => {
    if (audioRef.current) {
      audioRef.current.src = preview
      audioRef.current.play()
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && script.trim()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && enhancedScript) {
      setCurrentStep(3)
    } else if (currentStep === 3 && selectedTemplate) {
      setCurrentStep(4)
    } else if (currentStep === 4 && selectedVoice) {
      setCurrentStep(5)
    }
  }

  const handleGenerate = async () => {
    if (!user) {
      error('Debes iniciar sesión para crear videos')
      return
    }

    if (!script.trim()) {
      error('Por favor ingresa un script')
      return
    }

    if (!selectedTemplate) {
      error('Por favor selecciona una plantilla')
      return
    }

    if (!selectedVoice) {
      error('Por favor selecciona una voz')
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch('/api/videos/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          title: `Video ${new Date().toLocaleDateString()}`,
          script: enhancedScript || script,
          templateId: selectedTemplate,
          voiceId: selectedVoice,
          enhancedScript: enhancedScript
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el video')
      }

      success('¡Video creado exitosamente!', `Te quedan ${data.credits_remaining} créditos`)

      // Redirect to library after a short delay
      setTimeout(() => {
        router.push('/library')
      }, 2000)

    } catch (err) {
      console.error('Error creating video:', err)
      error(
        'Error al crear el video',
        err instanceof Error ? err.message : 'Inténtalo de nuevo más tarde'
      )
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((step) => {
              const Icon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = currentStep > step.id

              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                      ${isCompleted ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg' :
                        isActive ? 'bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary text-primary' :
                        'bg-muted text-muted-foreground'}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <Icon className="w-6 h-6" />
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <div className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                      {step.name}
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <Card className="card-glow border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                    Escribe tu Guión
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Comparte tu idea y déjanos hacer el resto
                  </p>
                </div>

                <div className="relative">
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    placeholder={SCRIPT_PLACEHOLDERS[currentPlaceholder]}
                    className="w-full h-64 p-6 border-2 border-border rounded-2xl bg-background/50 backdrop-blur-sm text-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    onFocus={() => {
                      const nextPlaceholder = (currentPlaceholder + 1) % SCRIPT_PLACEHOLDERS.length
                      setCurrentPlaceholder(nextPlaceholder)
                    }}
                  />
                  <div className="absolute bottom-4 right-4 text-sm text-muted-foreground">
                    {script.length}/2000 caracteres
                  </div>
                </div>

                <div className="flex justify-between items-center mt-8">
                  <div className="text-sm text-muted-foreground">
                    💡 Tip: Sé específico sobre tu audiencia y objetivo
                  </div>
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!script.trim()}
                    className="btn-primary px-8"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 2 && (
            <Card className="card-glow border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                    Mejora con IA
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Nuestra IA optimizará tu guión para máximo engagement
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Original Script */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Original
                    </h3>
                    <div className="p-4 bg-muted/30 rounded-xl h-48 overflow-y-auto text-sm">
                      {script}
                    </div>
                  </div>

                  {/* Enhanced Script */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-primary" />
                      Mejorado con IA
                    </h3>
                    <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-xl h-48 overflow-y-auto text-sm">
                      {isEnhancing ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-primary">Analizando tu script...</p>
                          </div>
                        </div>
                      ) : enhancedScript ? (
                        enhancedScript
                      ) : (
                        <div className="text-muted-foreground italic">
                          La versión mejorada aparecerá aquí
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                  </Button>

                  {!enhancedScript ? (
                    <Button
                      onClick={handleEnhanceScript}
                      disabled={isEnhancing}
                      className="btn-primary px-8"
                    >
                      {isEnhancing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Mejorando...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          Mejorar con IA
                        </>
                      )}
                    </Button>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEnhancedScript('')
                          setIsEnhancing(false)
                        }}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Regenerar
                      </Button>
                      <Button
                        onClick={handleNext}
                        className="btn-primary px-8"
                      >
                        Continuar
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 3 && (
            <Card className="card-glow border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Palette className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                    Elige tu Plantilla
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Selecciona el estilo visual que mejor represente tu contenido
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                  {TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplate(template.id)}
                      className={`
                        relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl
                        ${selectedTemplate === template.id ?
                          'border-primary bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg' :
                          'border-border hover:border-primary/50 bg-card'
                        }
                      `}
                    >
                      {template.isPremium && (
                        <div className="absolute top-3 right-3">
                          <Crown className="w-5 h-5 text-amber-500" />
                        </div>
                      )}

                      <div className="text-center">
                        <div className={`
                          w-16 h-16 bg-gradient-to-br ${template.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl
                        `}>
                          {template.preview}
                        </div>
                        <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>

                      {selectedTemplate === template.id && (
                        <div className="absolute top-3 left-3">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!selectedTemplate}
                    className="btn-primary px-8"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 4 && (
            <Card className="card-glow border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Volume2 className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                    Selecciona la Voz
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Elige la voz que dará vida a tu contenido
                  </p>
                </div>

                <audio ref={audioRef} className="hidden" />

                <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                  {VOICES.map((voice) => (
                    <div
                      key={voice.id}
                      onClick={() => setSelectedVoice(voice.id)}
                      className={`
                        relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-xl
                        ${selectedVoice === voice.id ?
                          'border-primary bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg' :
                          'border-border hover:border-primary/50 bg-card'
                        }
                      `}
                    >
                      {voice.premium && (
                        <div className="absolute top-3 right-3">
                          <Crown className="w-5 h-5 text-amber-500" />
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{voice.name}</h3>
                          <p className="text-sm text-muted-foreground">{voice.gender}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePlayVoicePreview(voice.preview)
                          }}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      </div>

                      <p className="text-sm text-muted-foreground">{voice.description}</p>

                      {selectedVoice === voice.id && (
                        <div className="absolute top-3 left-3">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Atrás
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={!selectedVoice}
                    className="btn-primary px-8"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 5 && (
            <Card className="card-glow border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clapperboard className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                    Generar Video
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Todo está listo. Vamos a crear tu Short viral
                  </p>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-6 mb-8">
                  <h3 className="font-semibold mb-4 text-center">Resumen de tu Video</h3>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-primary">Plantilla</div>
                      <div>{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-primary">Voz</div>
                      <div>{VOICES.find(v => v.id === selectedVoice)?.name}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-primary">Duración Est.</div>
                      <div>~45 segundos</div>
                    </div>
                  </div>
                </div>

                {isGenerating ? (
                  <div className="text-center py-8">
                    <div className="mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-10 h-10 text-white animate-pulse" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Creando tu video...</h3>
                      <p className="text-muted-foreground">Esto puede tomar unos minutos</p>
                    </div>

                    <div className="max-w-md mx-auto">
                      <div className="bg-muted rounded-full h-2 mb-2">
                        <div className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full w-1/3 animate-pulse"></div>
                      </div>
                      <p className="text-sm text-muted-foreground">Ensamblando tu Short...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(4)}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Atrás
                    </Button>
                    <Button
                      onClick={handleGenerate}
                      className="btn-primary px-12 py-3 text-lg"
                    >
                      <Zap className="w-5 h-5 mr-2" />
                      Crear Video
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}