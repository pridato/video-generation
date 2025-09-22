'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth'
import { useToast } from '@/hooks/ui'
import { Header } from '@/components/common/header'

// Components
import ProgressSteps from './components/ProgressSteps'
import ScriptInputStep from './components/ScriptInputStep'
import ScriptEnhancementStep from './components/ScriptEnhancementStep'
import VoiceSelectionStep from './components/VoiceSelectionStep'
import VideoSummaryStep from './components/VideoSummaryStep'

// Types and constants
import { ScriptResponse } from './types'
import { STEPS, TEMPLATES, VOICES, SPEED_OPTIONS, CATEGORIAS } from './constants'

export default function CreateVideoPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { success, error } = useToast()

  // States
  const [currentStep, setCurrentStep] = useState(1)
  const [script, setScript] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('tech')
  const [enhancedScript, setEnhancedScript] = useState('')
  const [scriptMetadata, setScriptMetadata] = useState<ScriptResponse | null>(null)
  const selectedTemplate = 'tech-tutorial' // Plantilla por defecto
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null)
  const [selectedSpeed, setSelectedSpeed] = useState(1.0)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Utility functions
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }

  const calculateDuration = (text: string, speed: number) => {
    const words = countWords(text)
    const wordsPerMinute = 150
    const baseDurationMinutes = words / wordsPerMinute
    const baseDurationSeconds = baseDurationMinutes * 60
    const adjustedDuration = baseDurationSeconds / speed
    return Math.round(adjustedDuration)
  }

  // Script enhancement
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

      // Actualizar estados - scriptMetadata contiene TODO el video
      setEnhancedScript(data.script_mejorado)
      setScriptMetadata({
        ...data,
        script_original: script,
        categoria: selectedCategoria,
        fecha_creacion: new Date().toISOString()
      })

      success('Script mejorado exitosamente', `Duración estimada: ${data.duracion_estimada} segundos`)

      console.log('📝 Script mejorado completo creado:', data)

    } catch (error) {
      console.error('Error enhancing script:', error)
      // Fallback: crear script mejorado básico usando el script original
      const scriptFallback: ScriptResponse = {
        script_original: script,
        script_mejorado: script,
        categoria: selectedCategoria,
        duracion_estimada: calculateDuration(script, 1.0),
        segmentos: [
          {
            texto: script,
            duracion: calculateDuration(script, 1.0),
            tipo: "contenido"
          }
        ],
        palabras_clave: [],
        tono: "neutral",
        mejoras_aplicadas: ["uso del script original"],
        embedding: undefined,
        fecha_creacion: new Date().toISOString()
      }

      setEnhancedScript(script)
      setScriptMetadata(scriptFallback)

      console.log('⚠️ Fallback aplicado - Script completo creado:', scriptFallback)
    } finally {
      setIsEnhancing(false)
    }
  }

  // Note: Voice generation is now handled in VoiceSelectionStep component

  // Video generation (final step)
  const handleGenerate = async () => {
    if (!user) {
      error('Debes iniciar sesión para crear videos')
      return
    }

    if (!scriptMetadata?.audio_data || !scriptMetadata?.clips_data) {
      error('Faltan datos de audio o clips. Por favor, regresa y completa el proceso.')
      return
    }

    setIsGenerating(true)

    try {
      console.log('🎬 Iniciando creación final del video...')
      console.log('📊 Datos del video completo:', {
        script: scriptMetadata.script_mejorado.length,
        audio_duration: scriptMetadata.audio_data.duration,
        clips_count: scriptMetadata.clips_data.selected_clips.length,
        engagement: scriptMetadata.clips_data.estimated_engagement
      })

      // Llamar al endpoint de generación de video
      const response = await fetch('http://localhost:8000/generar-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script_metadata: scriptMetadata,
          user_id: user.id,
          title: `Video sobre ${selectedCategoria} - ${new Date().toLocaleDateString()}`
        })
      })

      if (!response.ok) {
        throw new Error('Error al ensamblar el video')
      }

      const videoData = await response.json()

      console.log('✅ Video ensamblado exitosamente:', videoData)

      success(
        '¡Video creado exitosamente!',
        `Video de ${videoData.duration.toFixed(1)}s con ${videoData.metadata.clips_count} clips`
      )

      // Redirigir a la página de preview con los datos del video
      const videoDataParam = encodeURIComponent(JSON.stringify(videoData))
      router.push(`/video-preview?videoData=${videoDataParam}`)

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

  // Voice preview
  const handlePlayVoicePreview = (preview: string) => {
    if (audioRef.current) {
      audioRef.current.src = preview
      audioRef.current.playbackRate = selectedSpeed
      audioRef.current.play().catch(() => {
        error('No se pudo reproducir la muestra de voz')
      })
    }
  }

  // Navigation
  const handleNext = () => {
    if (currentStep === 1 && script.trim()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && enhancedScript && scriptMetadata) {
      setCurrentStep(3) // Va a selección de voz
    } else if (currentStep === 3 && selectedVoice) {
      setCurrentStep(4) // Va al resumen donde se hace la carga automáticamente
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRegenerateScript = () => {
    setEnhancedScript('')
    setScriptMetadata(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <Header />

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Progress Steps */}
        <ProgressSteps currentStep={currentStep} steps={STEPS} />

        {/* Step Content */}
        <div className="animate-fade-in">
          {currentStep === 1 && (
            <ScriptInputStep
              script={script}
              setScript={setScript}
              selectedCategoria={selectedCategoria}
              setSelectedCategoria={setSelectedCategoria}
              onNext={handleNext}
              countWords={countWords}
              calculateDuration={calculateDuration}
              categorias={CATEGORIAS}
            />
          )}

          {currentStep === 2 && (
            <ScriptEnhancementStep
              script={script}
              enhancedScript={enhancedScript}
              scriptMetadata={scriptMetadata}
              isEnhancing={isEnhancing}
              onEnhance={handleEnhanceScript}
              onRegenerate={handleRegenerateScript}
              onNext={handleNext}
              calculateDuration={calculateDuration}
            />
          )}

          {currentStep === 3 && (
            <VoiceSelectionStep
              selectedVoice={selectedVoice}
              setSelectedVoice={setSelectedVoice}
              selectedSpeed={selectedSpeed}
              setSelectedSpeed={setSelectedSpeed}
              onBack={handleBack}
              onNext={handleNext}
              onPlayPreview={handlePlayVoicePreview}
              voices={VOICES}
              speedOptions={SPEED_OPTIONS}
              audioRef={audioRef}
            />
          )}

          {currentStep === 4 && (
            <VideoSummaryStep
              scriptMetadata={scriptMetadata}
              setScriptMetadata={setScriptMetadata}
              selectedTemplate={selectedTemplate}
              selectedVoice={selectedVoice}
              selectedSpeed={selectedSpeed}
              selectedCategoria={selectedCategoria}
              isGenerating={isGenerating}
              onBack={handleBack}
              onGenerate={handleGenerate}
              onError={error}
              onSuccess={success}
              templates={TEMPLATES}
              voices={VOICES}
              speedOptions={SPEED_OPTIONS}
              categorias={CATEGORIAS}
            />
          )}
        </div>
      </main>

      {/* Hidden audio element for previews */}
      <audio ref={audioRef} />
    </div>
  )
}