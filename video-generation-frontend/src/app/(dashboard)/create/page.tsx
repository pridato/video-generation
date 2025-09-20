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
import VideoGenerationStep from './components/VideoGenerationStep'

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
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false)

  const audioRef = useRef<HTMLAudioElement>(null)

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

  // Voice generation
  const generateVoice = async (): Promise<boolean> => {
    if (!scriptMetadata || !selectedVoice) {
      error('Faltan datos del script o voz seleccionada')
      return false
    }

    setIsGeneratingVoice(true)

    try {
      const enhancedScript = {
        segmentos: (scriptMetadata.segmentos || []).map(seg => ({
          texto: seg.texto,
          tipo: seg.tipo,
          emocion: "neutral",
          duracion: seg.duracion,
          velocidad: selectedSpeed,
          pausa_despues: 0.5
        }))
      }

      const response = await fetch('http://localhost:8000/generar-voz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: scriptMetadata.script_mejorado || enhancedScript || script,
          voice_id: selectedVoice,
          video_id: `temp_${Date.now()}`,
          enhanced_script: enhancedScript
        })
      })

      if (!response.ok) {
        throw new Error('Error al generar la voz')
      }

      const audioData = await response.json()

      // Actualizar scriptMetadata con los datos de audio - esta variable contiene TODO el video
      const videoCompleto = {
        ...(scriptMetadata || {}),
        audio_data: {
          audio_base64: audioData.audio_base64,
          filename: audioData.filename,
          duration: audioData.duration,
          voice_id: audioData.voice_id,
          segments: audioData.segments
        },
        template_id: selectedTemplate ?? undefined,
        voice_id: selectedVoice,
        speed: selectedSpeed,
        categoria: selectedCategoria
      }

      setScriptMetadata(videoCompleto)

      console.log('🎵 Audio generado exitosamente:', {
        filename: audioData.filename,
        duration: audioData.duration,
        segments: audioData.segments.length
      })
      console.log('🎬 Datos completos del video:', videoCompleto)

      return true

    } catch (err) {
      console.error('Error generando audio:', err)
      error(
        'Error al generar el audio',
        err instanceof Error ? err.message : 'Inténtalo de nuevo más tarde'
      )
      return false
    } finally {
      setIsGeneratingVoice(false)
    }
  }

  // Video generation
  const handleGenerate = async () => {
    if (!user) {
      error('Debes iniciar sesión para crear videos')
      return
    }

    if (!script.trim() || !selectedVoice || !scriptMetadata) {
      error('Por favor completa todos los campos requeridos')
      return
    }

    setIsGenerating(true)

    try {
      // Paso 1: Generar audio primero
      console.log('🎵 Iniciando generación de audio...')
      const audioGenerado = await generateVoice()

      if (!audioGenerado) {
        return
      }

      console.log('✅ Audio generado exitosamente, procediendo con video...')

      // guardamos el audio guardado en scriptmetaData
      success('¡Video creado exitosamente!')

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
      setCurrentStep(3) // Va directo a selección de voz
    } else if (currentStep === 3 && selectedVoice) {
      setCurrentStep(4) // Va directo a generación
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
            <VideoGenerationStep
              scriptMetadata={scriptMetadata}
              selectedTemplate={selectedTemplate}
              selectedVoice={selectedVoice}
              selectedSpeed={selectedSpeed}
              selectedCategoria={selectedCategoria}
              enhancedScript={enhancedScript}
              script={script}
              isGenerating={isGenerating}
              isGeneratingVoice={isGeneratingVoice}
              onBack={handleBack}
              onGenerate={handleGenerate}
              calculateDuration={calculateDuration}
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