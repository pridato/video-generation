'use client'

import { FC } from 'react'
import { Sparkles, Mic, Clapperboard, CheckCircle, Zap } from 'lucide-react'

interface LoadingStateProps {
  stage: 'analyzing' | 'generating-audio' | 'assembling' | 'completed'
  progress?: number
  message?: string
}

export const AILoadingState: FC<LoadingStateProps> = ({
  stage,
  progress = 0,
  message
}) => {
  const getStageConfig = () => {
    switch (stage) {
      case 'analyzing':
        return {
          icon: Sparkles,
          title: 'Analizando tu script...',
          description: 'Nuestra IA está optimizando tu contenido para máximo engagement',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500',
          animation: 'animate-pulse'
        }
      case 'generating-audio':
        return {
          icon: Mic,
          title: 'Generando audio profesional...',
          description: 'Creando locución de alta calidad con síntesis de voz avanzada',
          color: 'text-green-500',
          bgColor: 'bg-green-500',
          animation: 'animate-bounce'
        }
      case 'assembling':
        return {
          icon: Clapperboard,
          title: 'Ensamblando tu Short...',
          description: 'Combinando audio, video y efectos para crear tu contenido final',
          color: 'text-orange-500',
          bgColor: 'bg-orange-500',
          animation: 'animate-spin'
        }
      case 'completed':
        return {
          icon: CheckCircle,
          title: '¡Tu video está listo!',
          description: 'Video generado exitosamente y listo para descargar',
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500',
          animation: ''
        }
    }
  }

  const config = getStageConfig()
  const Icon = config.icon

  return (
    <div className="flex flex-col items-center p-8 max-w-md mx-auto">
      {/* Icon with animation */}
      <div className={`
        w-16 h-16 rounded-2xl flex items-center justify-center mb-4
        bg-gradient-to-br from-${config.bgColor}/20 to-${config.bgColor}/10
        border border-${config.bgColor}/20
      `}>
        <Icon className={`w-8 h-8 ${config.color} ${config.animation}`} />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-2 text-center">
        {config.title}
      </h3>

      {/* Description */}
      <p className="text-muted-foreground text-center mb-6 text-sm">
        {message || config.description}
      </p>

      {/* Progress bar (only for non-completed stages) */}
      {stage !== 'completed' && (
        <div className="w-full max-w-xs">
          <div className="bg-muted rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 ${config.bgColor} rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Procesando...</span>
            <span>{Math.round(progress)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Audio wave animation component
export const AudioWaveAnimation: FC = () => {
  return (
    <div className="flex items-center justify-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-1 bg-green-500 rounded-full animate-pulse"
          style={{
            height: `${Math.random() * 20 + 10}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  )
}

// Multi-step progress indicator
export const MultiStepProgress: FC<{
  steps: string[],
  currentStep: number,
  isComplete?: boolean
}> = ({ steps, currentStep, isComplete = false }) => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = index < currentStep || isComplete
          const isCurrent = index === currentStep && !isComplete

          return (
            <div key={index} className="flex flex-col items-center flex-1">
              <div className={`
                w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all duration-300
                ${isCompleted ?
                  'bg-primary border-primary text-white' :
                  isCurrent ?
                    'border-primary text-primary bg-primary/10' :
                    'border-muted-foreground/30 text-muted-foreground'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span className={`
                text-xs mt-1 text-center
                ${isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'}
              `}>
                {step}
              </span>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className={`
                  absolute h-0.5 w-full max-w-[100px] top-4 left-1/2 transform -translate-x-1/2 translate-x-8
                  ${index < currentStep || isComplete ? 'bg-primary' : 'bg-muted-foreground/30'}
                  transition-colors duration-300
                `} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Pulsing loader for AI operations
export const AIPulseLoader: FC<{ message?: string }> = ({ message = "Procesando con IA..." }) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full animate-pulse" />
        <div className="absolute inset-0 w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full animate-ping opacity-30" />
        <div className="absolute inset-2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <Zap className="w-4 h-4 text-primary animate-pulse" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

// Success state with celebration
export const SuccessState: FC<{
  title?: string,
  description?: string,
  actionLabel?: string,
  onAction?: () => void
}> = ({
  title = "¡Completado!",
  description = "Tu video ha sido creado exitosamente",
  actionLabel = "Ver Video",
  onAction
}) => {
  return (
    <div className="text-center p-8">
      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
        <CheckCircle className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-green-600 mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6">{description}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transition-all duration-200"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

// Progress ring component
export const ProgressRing: FC<{
  progress: number,
  size?: number,
  strokeWidth?: number,
  color?: string
}> = ({
  progress,
  size = 120,
  strokeWidth = 8,
  color = "#FF6B35"
}) => {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}