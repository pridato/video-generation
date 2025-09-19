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
  Palette,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Wand2,
  FileText,
  Volume2,
  Clapperboard,
  Zap,
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

// Categorías disponibles
const CATEGORIAS = [
  { id: 'tech', name: 'Tecnología', emoji: '💻' },
  { id: 'marketing', name: 'Marketing', emoji: '📈' },
  { id: 'education', name: 'Educación', emoji: '🎓' },
  { id: 'entertainment', name: 'Entretenimiento', emoji: '🎬' },
  { id: 'lifestyle', name: 'Estilo de Vida', emoji: '✨' },
  { id: 'business', name: 'Negocios', emoji: '💼' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
  { id: 'food', name: 'Comida', emoji: '🍳' },
  { id: 'travel', name: 'Viajes', emoji: '✈️' },
  { id: 'news', name: 'Noticias', emoji: '📰' }
]

interface Segmento {
  texto: string;
  duracion: number;
  tipo: string; // ej: "hook" | "contenido" | "cta"
}

interface ScriptResponse {
  script_mejorado: string;
  duracion_estimada: number;
  segmentos: Segmento[];
  palabras_clave: string[];
  tono: string;
  mejoras_aplicadas: string[];
}

// Template and Voice definitions
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
    id: 'alloy',
    name: 'Alexa',
    gender: 'Neutral',
    description: 'Voz equilibrada y versátil, perfecta para cualquier contenido',
    premium: false,
    openaiVoice: 'alloy',
    preview: '/audio/alloy-preview.mp3'
  },
  {
    id: 'echo',
    name: 'Eco',
    gender: 'Masculina',
    description: 'Voz masculina clara y profesional',
    premium: false,
    openaiVoice: 'echo',
    preview: '/audio/echo-preview.mp3'
  },
  {
    id: 'fable',
    name: 'Fábula',
    gender: 'Masculina',
    description: 'Voz narrativa cálida, ideal para storytelling',
    premium: false,
    openaiVoice: 'fable',
    preview: '/audio/fable-preview.mp3'
  },
  {
    id: 'onyx',
    name: 'Ónix',
    gender: 'Masculina',
    description: 'Voz profunda y autoritaria, perfecta para contenido serio',
    premium: false,
    openaiVoice: 'onyx',
    preview: '/audio/onyx-preview.mp3'
  },
]

const SPEED_OPTIONS = [
  { value: 0.75, label: 'Lenta (0.75x)' },
  { value: 1.0, label: 'Normal (1.0x)' },
  { value: 1.25, label: 'Rápida (1.25x)' },
  { value: 1.5, label: 'Muy rápida (1.5x)' }
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
  const [selectedCategoria, setSelectedCategoria] = useState('tech')
  const [enhancedScript, setEnhancedScript] = useState('')
  const [scriptMetadata, setScriptMetadata] = useState<ScriptResponse | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [selectedSpeed, setSelectedSpeed] = useState(1.0)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Función para contar palabras
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  // Función para calcular duración estimada
  const calculateDuration = (text: string, speed: number) => {
    const words = countWords(text)
    // Velocidad promedio de habla: 150 palabras por minuto
    const wordsPerMinute = 150
    const baseDurationMinutes = words / wordsPerMinute
    const baseDurationSeconds = baseDurationMinutes * 60

    // Ajustar por velocidad de reproducción
    const adjustedDuration = baseDurationSeconds / speed

    return Math.round(adjustedDuration)
  }

  /**
   * Maneja la mejora del script usando IA
   */
  const handleEnhanceScript = async () => {
    if (!script.trim()) {
      error('Por favor ingresa un script primero')
      return
    }

    setIsEnhancing(true)

    try {
      const response = await fetch('http://localhost:8000/mejorar-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: script,
          categoria: selectedCategoria
        })
      })

      if (!response.ok) {
        throw new Error('Error al mejorar el script')
      }

      const data = await response.json()
      setEnhancedScript(data.script_mejorado)
      setScriptMetadata(data)
      success('Script mejorado exitosamente', `Duración estimada: ${data.duracion_estimada} segundos`)
      
    } catch (error) {
      console.error('Error enhancing script:', error)
      // Fallback: usar script original
      setEnhancedScript(script)
    } finally {
      setIsEnhancing(false)
    }
  }

  /**
   * Reproduce la muestra de voz desde archivo estático
   */
  const handlePlayVoicePreview = (preview: string) => {
    if (audioRef.current) {
      audioRef.current.src = preview
      audioRef.current.playbackRate = selectedSpeed
      audioRef.current.play().catch(() => {
        error('No se pudo reproducir la muestra de voz')
      })
    }
  }

  /**
   * Maneja la navegación al siguiente paso
   */
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


  /**
   * Maneja la navegación al paso anterior
   */
  const handleGenerate = async () => {
    if (!user) {
      error('Debes iniciar sesión para crear videos')
      return
    }

    if (!script.trim() || !selectedTemplate || !selectedVoice) {
      error('Por favor completa todos los campos requeridos')
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
          script: script,
          templateId: selectedTemplate,
          voiceId: selectedVoice,
          categoria: selectedCategoria,
          enhanceScript: !!enhancedScript,
          speed: selectedSpeed
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
                    maxLength={2000}
                    onFocus={() => {
                      const nextPlaceholder = (currentPlaceholder + 1) % SCRIPT_PLACEHOLDERS.length
                      setCurrentPlaceholder(nextPlaceholder)
                    }}
                  />
                  <div className="absolute bottom-4 right-4 text-sm text-muted-foreground">
                    {countWords(script)} palabras | {script.length}/2000 caracteres
                    {script.trim() && (
                      <div className="mt-1">~{calculateDuration(script, 1.0)} segundos</div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-8">
                  <div className="text-sm text-muted-foreground">
                    💡 Tip: Necesitas al menos 5 palabras para continuar
                  </div>
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!script.trim() || countWords(script) < 5}
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
                      {enhancedScript && (
                        <span className="ml-2 px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full border border-green-500/20">
                          ✓ Listo
                        </span>
                      )}
                    </h3>
                    <div className="relative">
                      <div className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-xl h-48 overflow-y-auto text-sm">
                        {isEnhancing ? (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                              <p className="text-primary font-medium">Analizando tu script...</p>
                              <p className="text-xs text-muted-foreground mt-1">Optimizando estructura y engagement</p>
                            </div>
                          </div>
                        ) : enhancedScript ? (
                          <div className="space-y-3">
                            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                              {enhancedScript}
                            </div>
                            {scriptMetadata && (
                              <div className="pt-3 border-t border-primary/10 space-y-2">
                                <div className="flex items-center gap-2 text-xs text-green-600">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Duración estimada: {scriptMetadata.duracion_estimada || calculateDuration(enhancedScript, 1.0)}s</span>
                                </div>
                                {scriptMetadata.mejoras_aplicadas && (
                                  <div className="text-xs text-muted-foreground">
                                    <strong>Mejoras:</strong> {scriptMetadata.mejoras_aplicadas.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-muted-foreground">
                              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="italic">La versión mejorada aparecerá aquí</p>
                              <p className="text-xs mt-1">Haz clic en &quot;Mejorar con IA&quot; para comenzar</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {enhancedScript && (
                        <div className="absolute -bottom-2 -right-2">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
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
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEnhancedScript(script) // Usar script original
                          setCurrentStep(3)
                        }}
                        disabled={!script.trim() || countWords(script) < 5}
                      >
                        Saltar IA
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      <Button
                        onClick={handleEnhanceScript}
                        disabled={isEnhancing || !script.trim() || countWords(script) < 5}
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
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEnhancedScript('')
                          setScriptMetadata(null)
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
            <Card className="card-glow border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-primary via-secondary to-accent p-8 text-white relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="relative z-10 text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30">
                      <Palette className="w-10 h-10 text-white drop-shadow-lg" />
                    </div>
                    <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
                      Elige tu Plantilla
                    </h2>
                    <p className="text-white/90 text-lg max-w-2xl mx-auto">
                      Cada plantilla está diseñada para diferentes tipos de contenido. Selecciona la que mejor se adapte a tu mensaje.
                    </p>
                  </div>
                  {/* Decorative elements */}
                  <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                </div>

                <div className="p-8">
                  <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                    {TEMPLATES.map((template, index) => (
                      <div
                        key={template.id}
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`
                          group relative p-8 border-2 rounded-3xl cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl
                          ${selectedTemplate === template.id ?
                            'border-primary bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 shadow-xl shadow-primary/20 scale-[1.02]' :
                            'border-border/50 hover:border-primary/50 bg-gradient-to-br from-card to-card/80 hover:shadow-lg'
                          }
                        `}
                        style={{
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        {/* Premium badge */}
                        {template.isPremium && (
                          <div className="absolute top-4 right-4 z-10">
                            <div className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                              <Crown className="w-3 h-3" />
                              PRO
                            </div>
                          </div>
                        )}

                        {/* Selection indicator */}
                        {selectedTemplate === template.id && (
                          <div className="absolute top-4 left-4 z-10">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        )}

                        <div className="text-center relative">
                          {/* Template icon with enhanced styling */}
                          <div className={`
                            relative w-24 h-24 bg-gradient-to-br ${template.color} rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl
                            shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110
                            ${selectedTemplate === template.id ? 'shadow-xl scale-110' : ''}
                          `}>
                            <span className="drop-shadow-sm">{template.preview}</span>
                            {/* Glow effect */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${template.color} rounded-3xl blur-xl opacity-30 -z-10 scale-150`}></div>
                          </div>

                          <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                            {template.name}
                          </h3>
                          <p className="text-muted-foreground leading-relaxed text-sm">
                            {template.description}
                          </p>

                          {/* Hover effect indicator */}
                          <div className={`
                            mt-4 h-1 bg-gradient-to-r ${template.color} rounded-full transition-all duration-300 mx-auto
                            ${selectedTemplate === template.id ? 'w-full opacity-100' : 'w-0 opacity-0 group-hover:w-full group-hover:opacity-50'}
                          `}></div>
                        </div>

                        {/* Background pattern for selected */}
                        {selectedTemplate === template.id && (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl pointer-events-none">
                            <div className="absolute inset-0 opacity-30">
                              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-transparent"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Enhanced CTA section */}
                  <div className="flex justify-between items-center mt-12 pt-8 border-t border-border/50">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                      className="group"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                      Atrás
                    </Button>

                    <div className="text-center">
                      {selectedTemplate && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Plantilla seleccionada: <span className="font-semibold text-primary">
                            {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                          </span>
                        </p>
                      )}
                      <Button
                        onClick={handleNext}
                        disabled={!selectedTemplate}
                        className="btn-primary px-10 py-3 text-lg group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {selectedTemplate ? (
                          <>
                            Continuar con {TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                          </>
                        ) : (
                          'Selecciona una plantilla'
                        )}
                      </Button>
                    </div>
                  </div>
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

                {/* Selector de velocidad */}
                <div className="mt-8 max-w-md mx-auto">
                  <label className="block text-sm font-medium mb-3 text-center">Velocidad del audio</label>
                  <div className="grid grid-cols-2 gap-3">
                    {SPEED_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedSpeed(option.value)
                          // Actualizar velocidad del audio en reproducción si existe
                          if (audioRef.current && !audioRef.current.paused) {
                            audioRef.current.playbackRate = option.value
                          }
                        }}
                        className={`
                          p-3 rounded-xl border-2 text-sm font-medium transition-all
                          ${selectedSpeed === option.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50 hover:bg-primary/5'
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
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
                  <div className="grid md:grid-cols-5 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-primary">Categoría</div>
                      <div>{CATEGORIAS.find(c => c.id === selectedCategoria)?.name}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-primary">Plantilla</div>
                      <div>{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-primary">Voz</div>
                      <div>{VOICES.find(v => v.id === selectedVoice)?.name}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-primary">Velocidad</div>
                      <div>{SPEED_OPTIONS.find(s => s.value === selectedSpeed)?.label}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-primary">Duración Est.</div>
                      <div>{scriptMetadata?.duracion_estimada || calculateDuration(enhancedScript || script, selectedSpeed)} segundos</div>
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