'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Palette, Crown } from 'lucide-react'
import { Template } from '../types'

interface TemplateSelectionStepProps {
  selectedTemplate: string | null;
  setSelectedTemplate: (template: string) => void;
  onBack: () => void;
  onNext: () => void;
  templates: Template[];
}

export default function TemplateSelectionStep({
  selectedTemplate,
  setSelectedTemplate,
  onBack,
  onNext,
  templates
}: TemplateSelectionStepProps) {
  return (
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
            {templates.map((template, index) => (
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

                {/* Preview circle */}
                <div className={`
                  w-20 h-20 rounded-3xl mb-6 flex items-center justify-center text-3xl font-bold text-white shadow-lg bg-gradient-to-br ${template.color}
                  ${selectedTemplate === template.id ? 'scale-110 shadow-xl' : 'group-hover:scale-105'}
                  transition-all duration-300
                `}>
                  {template.preview}
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Selection indicator */}
                {selectedTemplate === template.id && (
                  <div className="absolute top-4 left-4">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-8">
            <Button
              variant="outline"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>
            <Button
              onClick={onNext}
              disabled={!selectedTemplate}
              className="btn-primary px-8"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}