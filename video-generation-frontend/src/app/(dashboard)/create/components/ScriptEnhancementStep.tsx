'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight, RotateCcw, Wand2, CheckCircle, Sparkles } from 'lucide-react'
import { ScriptResponse } from '../types'

interface ScriptEnhancementStepProps {
  script: string;
  enhancedScript: string;
  scriptMetadata: ScriptResponse | null;
  isEnhancing: boolean;
  onEnhance: () => void;
  onRegenerate: () => void;
  onNext: () => void;
  calculateDuration: (text: string, speed: number) => number;
}

export default function ScriptEnhancementStep({
  script,
  enhancedScript,
  scriptMetadata,
  isEnhancing,
  onEnhance,
  onRegenerate,
  onNext,
  calculateDuration
}: ScriptEnhancementStepProps) {
  return (
    <Card className="card-glow border-0 shadow-2xl overflow-hidden">
      <CardContent className="p-0">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-accent via-primary to-secondary p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30">
              <Wand2 className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
              Potencia con IA
            </h2>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Nuestra IA transformará tu idea en un script optimizado para máximo engagement y viralidad.
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        <div className="p-8">
          {/* Script Original */}
          <div className="mb-8">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <div className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-xs font-bold">1</span>
              </div>
              Tu Script Original
            </h3>
            <div className="bg-muted/50 border border-border/50 rounded-2xl p-6">
              <p className="text-sm text-muted-foreground leading-relaxed">{script}</p>
            </div>
          </div>

          {/* Enhanced Script */}
          {!enhancedScript ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">¡Listos para la magia!</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Nuestra IA analizará tu contenido y lo optimizará para máxima viralidad y engagement.
              </p>
              <Button
                onClick={onEnhance}
                disabled={isEnhancing}
                className="btn-primary px-12 py-4 text-lg"
              >
                {isEnhancing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                    Mejorando con IA...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-3" />
                    Mejorar con IA
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  Script Optimizado por IA
                </h3>
                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/20 rounded-2xl p-6">
                  <div className="text-sm leading-relaxed">
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
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onRegenerate}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Regenerar
                </Button>
                <Button
                  onClick={onNext}
                  className="btn-primary px-8"
                >
                  Continuar
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}