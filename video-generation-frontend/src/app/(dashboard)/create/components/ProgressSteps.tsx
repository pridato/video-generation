'use client'

import { Step } from '../types'

interface ProgressStepsProps {
  currentStep: number;
  steps: Step[];
}

export default function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step) => {
          const Icon = step.icon
          const isActive = currentStep === step.id
          const isCompleted = currentStep > step.id

          return (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={`
                  w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                  ${isCompleted ? 'bg-gradient-to-br from-primary to-secondary text-white shadow-lg' :
                    isActive ? 'bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary text-primary' :
                    'bg-muted text-muted-foreground'
                  }
                `}
              >
                <Icon className="w-6 h-6" />
              </div>

              <div className="mt-3 text-center">
                <div className={`
                  text-sm font-medium transition-colors
                  ${isActive ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'}
                `}>
                  {step.title}
                </div>
                <div className={`
                  w-2 h-2 rounded-full mx-auto mt-2 transition-all duration-300
                  ${isActive ? 'bg-primary scale-125' : isCompleted ? 'bg-green-500' : 'bg-muted-foreground/30'}
                `} />
              </div>

              {step.id < steps.length && (
                <div className={`
                  hidden md:block absolute w-24 h-0.5 top-6 translate-x-16 transition-colors duration-300
                  ${isCompleted ? 'bg-gradient-to-r from-primary to-secondary' : 'bg-muted'}
                `} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}