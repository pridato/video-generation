'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clapperboard, Wand2, Zap } from 'lucide-react'
import { ScriptResponse, Template, Voice, SpeedOption, Categoria } from '../types'

interface VideoGenerationStepProps {
  scriptMetadata: ScriptResponse | null;
  selectedTemplate: string | null;
  selectedVoice: string | null;
  selectedSpeed: number;
  selectedCategoria: string;
  enhancedScript: string;
  script: string;
  isGenerating: boolean;
  isGeneratingVoice: boolean;
  onBack: () => void;
  onGenerate: () => void;
  calculateDuration: (text: string, speed: number) => number;
  templates: Template[];
  voices: Voice[];
  speedOptions: SpeedOption[];
  categorias: Categoria[];
}

export default function VideoGenerationStep({
  scriptMetadata,
  selectedTemplate,
  selectedVoice,
  selectedSpeed,
  selectedCategoria,
  enhancedScript,
  script,
  isGenerating,
  isGeneratingVoice,
  onBack,
  onGenerate,
  calculateDuration,
  templates,
  voices,
  speedOptions,
  categorias
}: VideoGenerationStepProps) {
  return (
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

        {/* Script Details (if enhanced with AI) */}
        {scriptMetadata && scriptMetadata.mejoras_aplicadas && scriptMetadata.mejoras_aplicadas.length > 1 && (
          <div className="bg-gradient-to-br from-accent/5 to-primary/5 border border-accent/20 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-4 text-center flex items-center justify-center gap-2">
              <Wand2 className="w-5 h-5 text-accent" />
              Mejoras Aplicadas por IA
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-accent mb-2">Tono Detectado</div>
                <div className="capitalize">{scriptMetadata.tono}</div>
              </div>
              <div>
                <div className="font-medium text-accent mb-2">Palabras Clave</div>
                <div className="flex flex-wrap gap-1">
                  {scriptMetadata.palabras_clave && scriptMetadata.palabras_clave.slice(0, 4).map((palabra, index) => (
                    <span key={index} className="bg-accent/10 text-accent px-2 py-1 rounded-md text-xs">
                      {palabra}
                    </span>
                  ))}
                  {scriptMetadata.palabras_clave && scriptMetadata.palabras_clave.length > 4 && (
                    <span className="text-muted-foreground text-xs">+{scriptMetadata.palabras_clave.length - 4} más</span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="font-medium text-accent mb-2">Optimizaciones</div>
              <div className="flex flex-wrap gap-2">
                {scriptMetadata.mejoras_aplicadas && scriptMetadata.mejoras_aplicadas.map((mejora, index) => (
                  <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs">
                    {mejora}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Audio Status (if generated) */}
        {scriptMetadata?.audio_data && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
            <h3 className="font-semibold mb-4 text-center flex items-center justify-center gap-2 text-green-700">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              Audio Generado Exitosamente
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-green-700">Voz</div>
                <div className="text-green-600">{voices.find(v => v.id === scriptMetadata.audio_data?.voice_id)?.name || scriptMetadata.audio_data.voice_id}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-700">Duración</div>
                <div className="text-green-600">{Math.round(scriptMetadata.audio_data.duration)} segundos</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-green-700">Segmentos</div>
                <div className="text-green-600">{scriptMetadata.audio_data.segments.length} partes</div>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold mb-4 text-center">Resumen de tu Video</h3>
          <div className="grid md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-primary">Categoría</div>
              <div>{categorias.find(c => c.id === selectedCategoria)?.name}</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-primary">Plantilla</div>
              <div>{templates.find(t => t.id === selectedTemplate)?.name}</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-primary">Voz</div>
              <div>{voices.find(v => v.id === selectedVoice)?.name}</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-primary">Velocidad</div>
              <div>{speedOptions.find(s => s.value === selectedSpeed)?.label}</div>
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
                {isGeneratingVoice ? (
                  <div className="w-10 h-10 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <Zap className="w-10 h-10 text-white animate-pulse" />
                )}
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {isGeneratingVoice ? 'Generando audio...' : 'Creando tu video...'}
              </h3>
              <p className="text-muted-foreground">
                {isGeneratingVoice
                  ? 'Convirtiendo tu script a audio profesional'
                  : 'Ensamblando tu Short viral'
                }
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <div className="bg-muted rounded-full h-2 mb-2">
                <div className={`bg-gradient-to-r from-primary to-secondary h-2 rounded-full animate-pulse ${
                  isGeneratingVoice ? 'w-1/4' : 'w-3/4'
                }`}></div>
              </div>
              <p className="text-sm text-muted-foreground">
                {isGeneratingVoice
                  ? 'Paso 1 de 2: Síntesis de voz...'
                  : 'Paso 2 de 2: Ensamblando video...'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>
            <Button
              onClick={onGenerate}
              className="btn-primary px-12 py-3 text-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Crear Video
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}