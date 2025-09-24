'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowRight, FileText, Timer } from 'lucide-react'
import { Categoria } from '../types'

interface ScriptInputStepProps {
  script: string;
  setScript: (script: string) => void;
  selectedCategoria: string;
  setSelectedCategoria: (categoria: string) => void;
  onNext: () => void;
  countWords: (text: string) => number;
  calculateDuration: (text: string, speed: number) => number;
  categorias: Categoria[];
}

const PLACEHOLDERS = [
  "Explica cómo crear una API REST con Node.js en menos de 5 minutos...",
  "Enseña 3 conceptos de matemáticas que todo estudiante debe saber...",
  "Comparte 5 ejercicios efectivos para ganar masa muscular en casa...",
  "Muestra cómo preparar un desayuno saludable en 10 minutos..."
]

export default function ScriptInputStep({
  script,
  setScript,
  selectedCategoria,
  setSelectedCategoria,
  onNext,
  countWords,
  calculateDuration,
  categorias
}: ScriptInputStepProps) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0)

  const wordCount = countWords(script)
  const duration = calculateDuration(script, 1.0)
  const isValid = script.trim() && wordCount >= 5

  return (
    <Card className="card-glow border-0 shadow-2xl overflow-hidden">
      <CardContent className="p-0">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-primary via-secondary to-accent p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30">
              <FileText className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
              Escribe tu Script
            </h2>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Comparte tu idea y nosotros la convertiremos en un Short viral que capture la atención desde el primer segundo.
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        <div className="p-8">
          {/* Category Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium mb-4">Categoría del contenido</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categorias.map((categoria) => (
                <button
                  key={categoria.id}
                  onClick={() => setSelectedCategoria(categoria.id)}
                  className={`
                    p-4 rounded-2xl border-2 transition-all duration-300 hover:scale-105 text-left
                    ${selectedCategoria === categoria.id
                      ? 'border-primary bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg shadow-primary/20'
                      : 'border-border/50 hover:border-primary/50 bg-card hover:shadow-md'
                    }
                  `}
                >
                  <div className="text-2xl mb-2">{categoria.icon}</div>
                  <div className="font-semibold text-sm">{categoria.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {categoria.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Script Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-4">Tu contenido</label>
            <div className="relative">
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder={PLACEHOLDERS[currentPlaceholder]}
                className="min-h-32 text-base leading-relaxed resize-none border-2 rounded-2xl focus:ring-2 focus:ring-primary/20 transition-all duration-300"
                onFocus={() => {
                  setCurrentPlaceholder((prev) => (prev + 1) % PLACEHOLDERS.length)
                }}
              />

              {script && (
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1 text-xs flex items-center gap-1">
                    <FileText className="w-3 h-3 text-primary" />
                    <span className={wordCount < 5 ? 'text-red-500' : 'text-green-600'}>
                      {wordCount} palabras
                    </span>
                  </div>
                  <div className="bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-1 text-xs flex items-center gap-1">
                    <Timer className="w-3 h-3 text-primary" />
                    <span>{duration}s</span>
                  </div>
                </div>
              )}
            </div>

            {wordCount > 0 && wordCount < 5 && (
              <p className="text-red-500 text-sm mt-2">
                Necesitas al menos 5 palabras para continuar
              </p>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button
              onClick={onNext}
              disabled={!isValid}
              className="btn-primary px-12 py-3 text-lg"
            >
              Continuar
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}