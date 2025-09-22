'use client'

import {  useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Mic, Play, User, Zap } from 'lucide-react'
import { Voice, SpeedOption } from '../types'

interface VoiceSelectionStepProps {
  selectedVoice: string | null;
  setSelectedVoice: (voice: string) => void;
  selectedSpeed: number;
  setSelectedSpeed: (speed: number) => void;
  onBack: () => void;
  onNext: () => void;
  onPlayPreview: (preview: string) => void;
  voices: Voice[];
  speedOptions: SpeedOption[];
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

export default function VoiceSelectionStep({
  selectedVoice,
  setSelectedVoice,
  selectedSpeed,
  setSelectedSpeed,
  onBack,
  onNext,
  onPlayPreview,
  voices,
  speedOptions,
  audioRef
}: VoiceSelectionStepProps) {

  // Efecto para cambiar la velocidad del audio cuando cambia selectedSpeed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = selectedSpeed
    }
  }, [selectedSpeed, audioRef])

  return (
    <Card className="card-glow border-0 shadow-2xl overflow-hidden">
      <CardContent className="p-0">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-secondary via-accent to-primary p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/30">
              <Mic className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
            <h2 className="text-4xl font-bold mb-3 drop-shadow-lg">
              Elige tu Voz
            </h2>
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              Selecciona la voz perfecta para tu contenido. Cada voz tiene su propia personalidad y estilo.
            </p>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-4 left-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        <div className="p-8">
          {/* Voice Selection */}
          <div className="mb-8">
            <h3 className="font-semibold mb-6">Voces Disponibles</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {voices.map((voice) => (
                <div
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice.id)}
                  className={`
                    group relative p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02]
                    ${selectedVoice === voice.id ?
                      'border-primary bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg shadow-primary/20' :
                      'border-border/50 hover:border-primary/50 bg-card hover:shadow-md'
                    }
                  `}
                >
                  {/* Gender/Type icon */}
                  <div className={`
                    w-12 h-12 rounded-xl mb-4 flex items-center justify-center transition-all duration-300
                    ${voice.gender === 'female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}
                    ${selectedVoice === voice.id ? 'scale-110' : 'group-hover:scale-105'}
                  `}>
                    <User className="w-6 h-6" />
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold text-sm mb-1">{voice.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2">{voice.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`
                        px-2 py-1 rounded-full text-white text-xs
                        ${voice.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'}
                      `}>
                        {voice.gender === 'female' ? 'Femenina' : 'Masculina'}
                      </span>
                      <span className="text-muted-foreground">{voice.language}</span>
                    </div>
                  </div>

                  {/* Preview button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onPlayPreview(voice.preview)
                    }}
                    className="w-full text-xs"
                  >
                    <Play className="w-3 h-3 mr-2" />
                    Escuchar
                  </Button>

                  {/* Selection indicator */}
                  {selectedVoice === voice.id && (
                    <div className="absolute top-3 right-3">
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Speed Selection */}
          <div className="mb-8">
            <h3 className="font-semibold mb-4">Velocidad de Narración</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {speedOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedSpeed(option.value)}
                  className={`
                    p-4 border-2 rounded-xl transition-all duration-300 hover:scale-105 text-center
                    ${selectedSpeed === option.value ?
                      'border-primary bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg' :
                      'border-border/50 hover:border-primary/50 bg-card'
                    }
                  `}
                >
                  <div className="flex items-center justify-center mb-2">
                    <Zap className={`w-4 h-4 ${selectedSpeed === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className={`text-sm font-semibold ${selectedSpeed === option.value ? 'text-primary' : ''}`}>
                    {option.label}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {option.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Atrás
            </Button>
            <Button
              onClick={onNext}
              disabled={!selectedVoice}
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