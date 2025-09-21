'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Clapperboard,
  Play,
  Volume2,
  FileText,
  Timer,
  Target,
  Zap,
  Eye,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Sparkles
} from 'lucide-react'
import { ScriptResponse, Template, Voice, SpeedOption, Categoria, ClipSelectionResult } from '../types'
  // Función para generar audio TTS
  import { useCallback } from 'react'

interface VideoSummaryStepProps {
  scriptMetadata: ScriptResponse | null;
  setScriptMetadata: (metadata: ScriptResponse) => void;
  selectedTemplate: string | null;
  selectedVoice: string | null;
  selectedSpeed: number;
  selectedCategoria: string;
  isGenerating: boolean;
  onBack: () => void;
  onGenerate: () => void;
  onError: (title: string, message?: string) => void;
  onSuccess: (title: string, message?: string) => void;
  templates: Template[];
  voices: Voice[];
  speedOptions: SpeedOption[];
  categorias: Categoria[];
}

export default function VideoSummaryStep({
  scriptMetadata,
  setScriptMetadata,
  selectedVoice,
  selectedSpeed,
  selectedCategoria,
  isGenerating,
  onBack,
  onGenerate,
  onError,
  onSuccess,
  voices,
  speedOptions,
  categorias
}: VideoSummaryStepProps) {

  const [expandedClip, setExpandedClip] = useState<string | null>(null)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [isSelectingClips, setIsSelectingClips] = useState(false)
  const [contentReady, setContentReady] = useState(false)
  const generationStartedRef = useRef(false)
  const scriptMetadataRef = useRef<ScriptResponse | null>(null)

  // Mantener ref actualizada
  useEffect(() => {
    scriptMetadataRef.current = scriptMetadata
  }, [scriptMetadata])

  const isProcessing = isGeneratingAudio || isSelectingClips


  const generateAudio = useCallback(async (): Promise<{ success: boolean; duration?: number }> => {
    if (!scriptMetadata || !selectedVoice) {
      onError('Error', 'No hay datos del script o voz seleccionada')
      return { success: false }
    }

    setIsGeneratingAudio(true)

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
          script: scriptMetadata.script_mejorado,
          voice_id: selectedVoice,
          video_id: `temp_${Date.now()}`,
          enhanced_script: enhancedScript
        })
      })

      if (!response.ok) {
        throw new Error('Error al generar la voz')
      }

      const audioData = await response.json()

      // Actualizar scriptMetadata con los datos de audio
      const updatedMetadata = {
        ...scriptMetadata,
        audio_data: {
          audio_base64: audioData.audio_base64,
          filename: audioData.filename,
          duration: audioData.duration,
          voice_id: audioData.voice_id,
          segments: audioData.segments
        },
        voice_id: selectedVoice,
        speed: selectedSpeed,
      }

      setScriptMetadata(updatedMetadata)

      console.log('🎵 Audio generado exitosamente:', {
        filename: audioData.filename,
        duration: audioData.duration,
        segments: audioData.segments.length
      })

      console.log('📊 ScriptMetadata completo con audio:', updatedMetadata)

      return { success: true, duration: audioData.duration }

    } catch (err) {
      console.error('Error generando audio:', err)
      onError(
        'Error al generar el audio',
        err instanceof Error ? err.message : 'Inténtalo de nuevo más tarde'
      )
      return { success: false }
    } finally {
      setIsGeneratingAudio(false)
    }
  }, [scriptMetadata, selectedVoice, selectedSpeed, setScriptMetadata, onError])

  // Función para seleccionar clips inteligentemente
  const selectClips = useCallback(async (audioDuration: number): Promise<boolean> => {
    const currentMetadata = scriptMetadataRef.current
    if (!currentMetadata) {
      onError('Error', 'No hay datos del script disponibles')
      return false
    }

    setIsSelectingClips(true)

    try {
      const response = await fetch('http://localhost:8000/seleccionar-clips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanced_script: currentMetadata,
          categoria: selectedCategoria,
          audio_duration: audioDuration,
          target_clips_count: 3
        })
      })

      if (!response.ok) {
        throw new Error('Error al seleccionar clips')
      }

      const clipsData: ClipSelectionResult = await response.json()

      // Actualizar scriptMetadata preservando TODOS los datos anteriores (especialmente audio_data)
      setScriptMetadata(prevMetadata => {
        if (!prevMetadata) return prevMetadata

        const updatedMetadata = {
          ...prevMetadata,
          clips_data: clipsData
        }

        console.log('🎬 Clips seleccionados exitosamente:', {
          clips_count: clipsData.selected_clips.length,
          engagement: clipsData.estimated_engagement,
          visual_coherence: clipsData.visual_coherence_score
        })

        console.log('📊 ScriptMetadata completo con clips:', updatedMetadata)
        console.log('🔍 Audio data presente después de clips:', !!updatedMetadata.audio_data)
        console.log('🔍 Clips data presente después de clips:', !!updatedMetadata.clips_data)

        return updatedMetadata
      })

      // Mostrar warnings si los hay
      if (clipsData.warnings && clipsData.warnings.length > 0) {
        onSuccess(
          'Clips seleccionados',
          `Se encontraron ${clipsData.selected_clips.length} clips. ${clipsData.warnings[0]}`
        )
      } else {
        onSuccess(
          'Clips seleccionados exitosamente',
          `Se seleccionaron ${clipsData.selected_clips.length} clips con ${(clipsData.estimated_engagement * 100).toFixed(0)}% de engagement estimado`
        )
      }

      return true

    } catch (err) {
      console.error('Error seleccionando clips:', err)
      onError(
        'Error al seleccionar clips',
        err instanceof Error ? err.message : 'Inténtalo de nuevo más tarde'
      )
      return false
    } finally {
      setIsSelectingClips(false)
    }
  }, [onError, selectedCategoria, setScriptMetadata, onSuccess])



  // Efecto para generar contenido automáticamente al montar el componente
  useEffect(() => {

    const generateContent = async () => {

      // Evitar múltiples ejecuciones usando ref
      if (!scriptMetadata || contentReady || isProcessing || generationStartedRef.current) {
        console.log('⏭️ Saltando generación por condiciones de control')
        return
      }

      // Verificar si ya tiene audio y clips
      if (scriptMetadata.audio_data && scriptMetadata.clips_data) {
        console.log('✅ Contenido ya completo, marcando como listo')
        setContentReady(true)
        return
      }

      // Solo procesar si no tiene audio aún
      if (!scriptMetadata.audio_data && !isGeneratingAudio && !isSelectingClips) {
        generationStartedRef.current = true // Marcar inmediatamente con ref
        console.log('🎬 Iniciando generación automática de contenido...')

        const audioResult = await generateAudio()

        if (audioResult.success && audioResult.duration) {
          console.log(`🎵 Audio listo, generando clips para ${audioResult.duration}s...`)
          const clipsSuccess = await selectClips(audioResult.duration)

          if (clipsSuccess) {
            setContentReady(true)
            console.log('✅ Todo el contenido generado exitosamente')
          }
        }
      } else {
        console.log('⚠️ Condiciones no cumplidas para generar contenido')
      }
    }

    // Solo ejecutar si tenemos scriptMetadata y no estamos en proceso
    if (scriptMetadata) {
      // Pequeño timeout para asegurar que los estados se estabilicen
      const timeoutId = setTimeout(() => {
        generateContent()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [contentReady, generateAudio, isGeneratingAudio, isProcessing, isSelectingClips, scriptMetadata, selectClips]) // Solo cuando cambie el scriptMetadata inicial



  // Efecto para actualizar contentReady cuando se completen audio y clips
  useEffect(() => {
    if (scriptMetadata?.audio_data && scriptMetadata?.clips_data) {
      setContentReady(true)
      console.log('✅ Contenido completamente listo')
    }
  }, [scriptMetadata?.audio_data, scriptMetadata?.clips_data])


  if (!scriptMetadata) {
    return (
      <Card className="card-glow border-0 shadow-2xl">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No hay datos del video disponibles</p>
        </CardContent>
      </Card>
    )
  }

  // Determinar si el contenido está listo
  const contentComplete = scriptMetadata.audio_data && scriptMetadata.clips_data

  // Debug: Log del estado del contenido
  console.log('🔍 Estado de contenido:', {
    hasAudio: !!scriptMetadata.audio_data,
    hasClips: !!scriptMetadata.clips_data,
    contentComplete,
    isProcessing
  })

  // Mostrar pantalla de carga mientras se procesa o no esté completo
  if (isProcessing || !contentComplete) {
    return (
      <Card className="card-glow border-0 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          {/* Header con gradiente */}
          <div className="bg-gradient-to-r from-primary via-secondary to-accent p-8 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
              <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
                Creando tu Video
              </h2>
              <p className="text-white/90 text-lg max-w-2xl mx-auto">
                La IA está procesando tu contenido para crear el video perfecto
              </p>
            </div>
          </div>

          <div className="p-8">
            {/* Processing Status */}
            <div className="mb-8 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl border border-primary/20">
              <div className="space-y-4">
                {/* Audio Generation Status */}
                <div className="flex items-center gap-3">
                  {isGeneratingAudio ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="font-medium">Generando audio con IA...</span>
                    </>
                  ) : (scriptMetadata.audio_data && selectedVoice) ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 font-medium">Audio generado exitosamente</span>
                      <Volume2 className="w-5 h-5 text-green-500" />
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                      <span className="text-muted-foreground">Generación de audio pendiente</span>
                    </>
                  )}
                </div>

                {/* Clip Selection Status */}
                <div className="flex items-center gap-3">
                  {isSelectingClips ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="font-medium">Seleccionando clips inteligentemente...</span>
                    </>
                  ) : scriptMetadata.clips_data ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 font-medium">
                        {scriptMetadata.clips_data.selected_clips.length} clips seleccionados
                      </span>
                      <Zap className="w-5 h-5 text-green-500" />
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                      <span className="text-muted-foreground">Selección de clips pendiente</span>
                    </>
                  )}
                </div>

                {/* Final Processing */}
                <div className="flex items-center gap-3">
                  {contentComplete ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-green-700 font-medium">¡Todo listo!</span>
                      <Sparkles className="w-5 h-5 text-green-500" />
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="font-medium">Finalizando preparación...</span>
                    </>
                  )}
                </div>
              </div>

              {/* Progress visualization */}
              <div className="mt-6">
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>Progreso</span>
                  <span>
                    {contentComplete ? '100%' :
                     scriptMetadata.audio_data ? '66%' :
                     isGeneratingAudio ? '33%' : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                    style={{
                      width: contentComplete ? '100%' :
                             scriptMetadata.audio_data ? '66%' :
                             isGeneratingAudio ? '33%' : '10%'
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={onBack}
                disabled={isProcessing}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Atrás
              </Button>

              <Button
                disabled
                className="btn-primary px-8 opacity-50"
              >
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedVoiceData = voices.find(v => v.id === selectedVoice)
  const selectedSpeedData = speedOptions.find(s => s.value === selectedSpeed)
  const selectedCategoriaData = categorias.find(c => c.id === selectedCategoria)
  const audioDuration = scriptMetadata.audio_data?.duration || 0
  const clipsData = scriptMetadata.clips_data

  const getEngagementColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500'
    if (score >= 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getEngagementLabel = (score: number) => {
    if (score >= 0.8) return 'Excelente'
    if (score >= 0.6) return 'Bueno'
    return 'Mejorable'
  }

  return (
    <Card className="card-glow border-0 shadow-2xl overflow-hidden">
      <CardContent className="p-0">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-primary via-secondary to-accent p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30">
              <Clapperboard className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
              Resumen del Video
            </h2>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Revisa todos los componentes de tu video antes de crearlo
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        <div className="p-8">
          {/* Información general del video */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Script y contenido */}
            <Card className="border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Contenido del Script</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedCategoriaData?.name} • {scriptMetadata.tono}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duración estimada:</span>
                    <Badge variant="secondary">
                      <Timer className="w-3 h-3 mr-1" />
                      {scriptMetadata.duracion_estimada}s
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Segmentos:</span>
                    <span className="font-medium">{scriptMetadata.segmentos.length}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Palabras clave:</span>
                    <span className="font-medium">{scriptMetadata.palabras_clave.length}</span>
                  </div>

                  {scriptMetadata.palabras_clave.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {scriptMetadata.palabras_clave.slice(0, 3).map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                      {scriptMetadata.palabras_clave.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{scriptMetadata.palabras_clave.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Audio y voz */}
            <Card className="border border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Audio Generado</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedVoiceData?.name} • {selectedSpeedData?.label}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duración real:</span>
                    <Badge variant="secondary">
                      <Timer className="w-3 h-3 mr-1" />
                      {audioDuration.toFixed(1)}s
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Voz:</span>
                    <span className="font-medium">{selectedVoiceData?.name}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Velocidad:</span>
                    <span className="font-medium">{selectedSpeedData?.label}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Segmentos procesados:</span>
                    <span className="font-medium">
                      {scriptMetadata.audio_data?.segments.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Clips seleccionados */}
          {clipsData && (
            <Card className="border border-border/50 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Clips Seleccionados por IA</h3>
                    <p className="text-sm text-muted-foreground">
                      {clipsData.selected_clips.length} clips optimizados para tu contenido
                    </p>
                  </div>
                </div>

                {/* Métricas de calidad */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-xl">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getEngagementColor(clipsData.estimated_engagement)}`}>
                      {(clipsData.estimated_engagement * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Engagement
                    </div>
                    <div className="text-xs mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getEngagementLabel(clipsData.estimated_engagement)}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getEngagementColor(clipsData.visual_coherence_score)}`}>
                      {(clipsData.visual_coherence_score * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" />
                      Coherencia
                    </div>
                    <div className="text-xs mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getEngagementLabel(clipsData.visual_coherence_score)}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getEngagementColor(clipsData.duration_compatibility)}`}>
                      {(clipsData.duration_compatibility * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Target className="w-3 h-3" />
                      Sincronización
                    </div>
                    <div className="text-xs mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getEngagementLabel(clipsData.duration_compatibility)}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Lista de clips */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">CLIPS SELECCIONADOS</h4>
                  {clipsData.selected_clips.map((clip, index) => (
                    <div key={clip.clip_id} className="border border-border/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-sm font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {clip.segment_type.toUpperCase()} • {clip.duration}s
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {clip.filename.split('/').pop()?.replace('.mp4', '')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {(clip.final_score * 100).toFixed(0)}% match
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedClip(
                              expandedClip === clip.clip_id ? null : clip.clip_id
                            )}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {expandedClip === clip.clip_id && (
                        <div className="mt-3 pt-3 border-t border-border/30 space-y-2">
                          <div className="text-xs text-muted-foreground">
                            <strong>Segmento:</strong> {clip.segment_text.substring(0, 80)}...
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">
                              Calidad: {clip.quality_score.toFixed(1)}/5
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {clip.motion_intensity}
                            </Badge>
                            {clip.concept_tags.slice(0, 2).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Warnings */}
                {clipsData.warnings && clipsData.warnings.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Advertencias</h4>
                        <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                          {clipsData.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Preview Section - Audio & Video */}
          {scriptMetadata.audio_data && clipsData && (
            <Card className="border border-border/50 mb-8">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  Vista Previa del Contenido
                </h3>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Audio Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Volume2 className="w-4 h-4 text-secondary" />
                      <h4 className="font-medium">Audio Generado</h4>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">{selectedVoiceData?.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {audioDuration.toFixed(1)}s
                        </Badge>
                      </div>

                      {scriptMetadata.audio_data.audio_base64 && (
                        <audio
                          controls
                          className="w-full"
                          style={{ maxHeight: '40px' }}
                        >
                          <source src={`data:audio/wav;base64,${scriptMetadata.audio_data.audio_base64}`} type="audio/wav" />
                          Tu navegador no soporta el elemento audio.
                        </audio>
                      )}

                      <div className="mt-3 text-xs text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Voz: {selectedVoiceData?.description}</span>
                          <span>Velocidad: {selectedSpeedData?.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Clips Preview */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Clapperboard className="w-4 h-4 text-accent" />
                      <h4 className="font-medium">Clips Seleccionados</h4>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                      {clipsData.selected_clips.slice(0, 3).map((clip, index) => (
                        <div key={clip.clip_id} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-primary/10 rounded text-xs flex items-center justify-center font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <div className="text-xs font-medium">
                                {clip.segment_type.toUpperCase()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {clip.duration}s
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {(clip.final_score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      ))}

                      {clipsData.selected_clips.length > 3 && (
                        <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/30">
                          +{clipsData.selected_clips.length - 3} clips más
                        </div>
                      )}
                    </div>

                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Todo listo para crear el video
                        </span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Audio y clips han sido procesados exitosamente
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Script preview */}
          <Card className="border border-border/50 mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Script Mejorado
              </h3>
              <div className="bg-muted/30 rounded-lg p-4 text-sm leading-relaxed">
                {scriptMetadata.script_mejorado}
              </div>

              {scriptMetadata.segmentos.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm text-muted-foreground mb-3">ESTRUCTURA</h4>
                  <div className="flex flex-wrap gap-2">
                    {scriptMetadata.segmentos.map((segmento, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {segmento.tipo}: {segmento.duracion}s
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isGenerating}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>

            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              className="btn-primary px-8"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creando Video...
                </>
              ) : (
                <>
                  <Clapperboard className="w-5 h-5 mr-2" />
                  Crear Video
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}