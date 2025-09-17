'use client'

import { useState } from 'react'
import { ROUTES } from '@/lib/constants'
import { Navbar } from '@/components/layout/navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { 
  Play, 
  Sparkles, 
  Mic, 
  Palette, 
  Eye, 
  Download,
  ArrowRight,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react'

const TEMPLATES = [
  {
    id: 'tech-tutorial',
    name: 'Tutorial Tecnológico',
    description: 'Perfecto para tutoriales de código y explicaciones técnicas',
    preview: '🖥️',
    isPremium: false
  },
  {
    id: 'viral-facts',
    name: 'Datos Virales',
    description: 'Formato atractivo para datos curiosos y trivia',
    preview: '🔥',
    isPremium: false
  },
  {
    id: 'life-tips',
    name: 'Consejos de Vida',
    description: 'Contenido motivacional y de superación personal',
    preview: '💡',
    isPremium: false
  },
  {
    id: 'code-to-video',
    name: 'Código a Video',
    description: 'Convierte explicaciones de código en videos (IA)',
    preview: '⚡',
    isPremium: true
  }
]

const VOICES = [
  { id: 'spanish-male-1', name: 'Carlos (Masculina)', accent: 'Español neutro', isPremium: false },
  { id: 'spanish-female-1', name: 'María (Femenina)', accent: 'Español neutro', isPremium: false },
  { id: 'spanish-male-pro', name: 'Alejandro Pro (Masculina)', accent: 'Español profesional', isPremium: true },
  { id: 'spanish-female-pro', name: 'Sofia Pro (Femenina)', accent: 'Español profesional', isPremium: true },
]

type Step = 'script' | 'template' | 'voice' | 'preview' | 'generate'

export default function CreateVideoPage() {
  const [currentStep, setCurrentStep] = useState<Step>('script')
  const [script, setScript] = useState('')
  const [enhancedScript, setEnhancedScript] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleEnhanceScript = async () => {
    if (!script.trim()) return
    
    setIsEnhancing(true)
    // Simular llamada a GPT-4
    setTimeout(() => {
      setEnhancedScript(
        `¡Descubre ${script.toLowerCase()}! 🚀\n\n` +
        `En este video te enseño paso a paso cómo dominar ${script.toLowerCase()}. ` +
        `¿Sabías que el 90% de los desarrolladores no conocen este truco? ` +
        `¡Quédate hasta el final para ver el secreto que cambiará tu forma de programar!\n\n` +
        `#coding #tutorial #tech #shorts`
      )
      setIsEnhancing(false)
      setCurrentStep('template')
    }, 2000)
  }

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId)
    setCurrentStep('voice')
  }

  const handleVoiceSelect = (voiceId: string) => {
    setSelectedVoice(voiceId)
    setCurrentStep('preview')
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setCurrentStep('generate')
    // Simular generación de video
    setTimeout(() => {
      setIsGenerating(false)
    }, 15000)
  }

  const steps = [
    { id: 'script', name: 'Guión', icon: Sparkles },
    { id: 'template', name: 'Plantilla', icon: Palette },
    { id: 'voice', name: 'Voz', icon: Mic },
    { id: 'preview', name: 'Vista Previa', icon: Eye },
    { id: 'generate', name: 'Generar', icon: Play }
  ]

  const currentStepIndex = steps.findIndex(step => step.id === currentStep)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Crear Nuevo Video
          </h1>
          <p className="text-muted-foreground mt-2">
            Convierte tu idea en un YouTube Short viral con IA
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep
              const isCompleted = index < currentStepIndex
              const StepIcon = step.icon
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                    ${isActive ? 'border-primary bg-primary text-white' : ''}
                    ${isCompleted ? 'border-success bg-success text-white' : ''}
                    ${!isActive && !isCompleted ? 'border-border text-muted-foreground' : ''}
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground mx-4" />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Script Input */}
          {currentStep === 'script' && (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Escribe tu Guión Inicial
                </CardTitle>
                <CardDescription>
                  Describe tu idea o escribe un guión básico. Nuestra IA lo mejorará automáticamente.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contenido del Video</label>
                  <textarea
                    placeholder="Ejemplo: Cómo usar React hooks para principiantes..."
                    className="w-full h-32 p-3 border border-border rounded-lg bg-input text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {script.length}/500 caracteres
                  </p>
                </div>
                
                <Button 
                  onClick={handleEnhanceScript}
                  disabled={!script.trim() || isEnhancing}
                  className="w-full btn-primary"
                  size="lg"
                >
                  {isEnhancing ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Mejorando con IA...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Mejorar con IA
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Template Selection */}
          {currentStep === 'template' && (
            <div className="space-y-6">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Guión Mejorado por IA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm">{enhancedScript}</pre>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    Selecciona una Plantilla
                  </CardTitle>
                  <CardDescription>
                    Elige el estilo visual que mejor se adapte a tu contenido
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TEMPLATES.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => handleTemplateSelect(template.id)}
                        className={`
                          p-4 border rounded-lg cursor-pointer transition-all
                          ${selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'border-border hover:border-accent'}
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{template.preview}</div>
                          <div className="flex-1">
                            <h3 className="font-semibold flex items-center gap-2">
                              {template.name}
                              {template.isPremium && (
                                <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                                  PRO
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Voice Selection */}
          {currentStep === 'voice' && (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="w-5 h-5 text-primary" />
                  Selecciona una Voz
                </CardTitle>
                <CardDescription>
                  Elige la voz que narrará tu video
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {VOICES.map((voice) => (
                    <div
                      key={voice.id}
                      onClick={() => handleVoiceSelect(voice.id)}
                      className={`
                        p-4 border rounded-lg cursor-pointer transition-all
                        ${selectedVoice === voice.id ? 'border-primary bg-primary/5' : 'border-border hover:border-accent'}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {voice.name}
                            {voice.isPremium && (
                              <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-full">
                                PRO
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {voice.accent}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <Play className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Preview */}
          {currentStep === 'preview' && (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  Vista Previa del Video
                </CardTitle>
                <CardDescription>
                  Revisa todos los detalles antes de generar tu video
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Guión Final</h3>
                      <div className="bg-muted p-3 rounded-lg text-sm">
                        {enhancedScript}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Configuración</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plantilla:</span>
                          <span>{TEMPLATES.find(t => t.id === selectedTemplate)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Voz:</span>
                          <span>{VOICES.find(v => v.id === selectedVoice)?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duración estimada:</span>
                          <span>45-60 segundos</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Formato:</span>
                          <span>MP4, 1080p</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <Button 
                  onClick={handleGenerate}
                  className="w-full btn-primary"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Generar Video (1 crédito)
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 5: Generation */}
          {currentStep === 'generate' && (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary ai-working" />
                  Generando tu Video
                </CardTitle>
                <CardDescription>
                  Nuestros algoritmos de IA están creando tu video. Esto puede tomar unos minutos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Procesando guión con GPT-4</span>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Generando audio con ElevenLabs</span>
                    {isGenerating ? (
                      <Clock className="w-4 h-4 text-primary ai-working" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-success" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Ensamblando video con FFmpeg</span>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Optimizando para YouTube Shorts</span>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>

                {!isGenerating && (
                  <div className="space-y-4">
                    <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-success mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">¡Video generado exitosamente!</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Tu video está listo para descargar y compartir en YouTube Shorts.
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <Button className="flex-1 btn-primary">
                        <Download className="w-4 h-4 mr-2" />
                        Descargar Video
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver en Biblioteca
                      </Button>
                    </div>
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