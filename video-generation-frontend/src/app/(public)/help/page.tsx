'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Search,
  HelpCircle,
  Book,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight,
  Play,
  Code,
  Palette,
  Mic,
  Download,
  CreditCard,
  Settings,
  Users,
  Zap,
  CheckCircle,
  ExternalLink,
  Clock,
  Star
} from 'lucide-react'

const FAQ_CATEGORIES = [
  {
    id: 'getting-started',
    name: 'Primeros Pasos',
    icon: Play,
    color: 'from-blue-500 to-cyan-500',
    questions: [
      {
        question: '¿Cómo creo mi primer video?',
        answer: 'Para crear tu primer video, ve a la sección "Crear" en el menú lateral. Escribe tu guión, selecciona una plantilla, elige una voz y haz clic en "Generar Video". El proceso toma aproximadamente 2-3 minutos.'
      },
      {
        question: '¿Qué tipo de contenido funciona mejor?',
        answer: 'Los videos educativos, tutoriales tech, y contenido de entretenimiento suelen tener mejor engagement. Mantén tu contenido entre 45-60 segundos para máxima retención.'
      },
      {
        question: '¿Puedo editar el video después de generarlo?',
        answer: 'Actualmente no ofrecemos edición posterior, pero puedes regenerar el video con diferentes parámetros. Próximamente añadiremos funciones de edición básica.'
      }
    ]
  },
  {
    id: 'templates',
    name: 'Plantillas y Diseño',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    questions: [
      {
        question: '¿Cuántas plantillas están disponibles?',
        answer: 'Tenemos más de 50 plantillas diferentes organizadas por categorías: Tech, Educativo, Entretenimiento, y Business. Los usuarios PRO tienen acceso a plantillas exclusivas.'
      },
      {
        question: '¿Puedo personalizar las plantillas?',
        answer: 'Sí, puedes modificar colores, fuentes, y algunos elementos visuales. Los usuarios PRO pueden crear plantillas personalizadas desde cero.'
      },
      {
        question: '¿Se añaden nuevas plantillas regularmente?',
        answer: 'Añadimos 5-10 nuevas plantillas cada mes basándonos en tendencias y feedback de usuarios. Los suscriptores reciben notificaciones de nuevas plantillas.'
      }
    ]
  },
  {
    id: 'voice-audio',
    name: 'Voz y Audio',
    icon: Mic,
    color: 'from-green-500 to-emerald-500',
    questions: [
      {
        question: '¿Qué voces están disponibles?',
        answer: 'Ofrecemos más de 15 voces en español con diferentes tonos: profesional, casual, energético, etc. Los usuarios PRO tienen acceso a voces premium y clonación de voz.'
      },
      {
        question: '¿Puedo usar mi propia voz?',
        answer: 'Con el plan PRO puedes clonar tu voz subiendo una muestra de 10-15 minutos. El proceso de entrenamiento toma 24-48 horas.'
      },
      {
        question: '¿Se puede ajustar la velocidad de habla?',
        answer: 'Sí, puedes ajustar la velocidad entre 0.8x y 1.3x para encontrar el ritmo perfecto para tu contenido.'
      }
    ]
  },
  {
    id: 'export-download',
    name: 'Exportar y Descargar',
    icon: Download,
    color: 'from-orange-500 to-red-500',
    questions: [
      {
        question: '¿En qué formatos puedo descargar mis videos?',
        answer: 'Todos los videos se exportan en MP4 1080p optimizado para redes sociales. Los usuarios PRO pueden exportar en 4K y otros formatos.'
      },
      {
        question: '¿Hay marca de agua en los videos?',
        answer: 'Los videos del plan gratuito incluyen una marca de agua discreta. Los planes de pago no tienen marca de agua.'
      },
      {
        question: '¿Puedo descargar videos anteriores?',
        answer: 'Sí, todos tus videos se almacenan en tu biblioteca por tiempo ilimitado. Puedes descargarlos cuando quieras.'
      }
    ]
  },
  {
    id: 'billing',
    name: 'Facturación y Planes',
    icon: CreditCard,
    color: 'from-yellow-500 to-orange-500',
    questions: [
      {
        question: '¿Cómo funciona la facturación?',
        answer: 'Los planes se facturan mensual o anualmente. Puedes cambiar de plan en cualquier momento y solo pagas la diferencia prorrateada.'
      },
      {
        question: '¿Hay descuento por pago anual?',
        answer: 'Sí, el pago anual tiene 20% de descuento. Por ejemplo, el plan PRO cuesta €19/mes mensual o €15.20/mes anual.'
      },
      {
        question: '¿Puedo cancelar en cualquier momento?',
        answer: 'Sí, puedes cancelar tu suscripción en cualquier momento desde la configuración. Mantienes acceso hasta el final del período facturado.'
      }
    ]
  },
  {
    id: 'technical',
    name: 'Soporte Técnico',
    icon: Settings,
    color: 'from-gray-500 to-slate-600',
    questions: [
      {
        question: '¿Qué hago si mi video no se genera?',
        answer: 'Verifica tu conexión a internet y que el guión no exceda 2000 caracteres. Si el problema persiste, contacta soporte con el ID del video.'
      },
      {
        question: '¿Por qué mi video tarda mucho en procesarse?',
        answer: 'El tiempo de procesamiento depende de la longitud del guión y la complejidad de la plantilla. Generalmente toma 2-5 minutos.'
      },
      {
        question: '¿Hay límite de videos por día?',
        answer: 'Plan gratuito: 3 videos/día. Plan Starter: 25 videos/día. Plan PRO: videos ilimitados.'
      }
    ]
  }
]

const QUICK_ACTIONS = [
  {
    title: 'Tutorial: Mi Primer Video',
    description: 'Guía paso a paso para crear tu primer video',
    icon: Play,
    color: 'from-blue-500 to-cyan-500',
    time: '5 min'
  },
  {
    title: 'Plantillas Populares',
    description: 'Descubre las plantillas más usadas',
    icon: Palette,
    color: 'from-purple-500 to-pink-500',
    time: '3 min'
  },
  {
    title: 'Optimizar para YouTube',
    description: 'Mejores prácticas para YouTube Shorts',
    icon: Code,
    color: 'from-green-500 to-emerald-500',
    time: '8 min'
  },
  {
    title: 'Configurar Pagos',
    description: 'Cómo configurar tu método de pago',
    icon: CreditCard,
    color: 'from-orange-500 to-red-500',
    time: '4 min'
  }
]

const CONTACT_OPTIONS = [
  {
    title: 'Chat en Vivo',
    description: 'Respuesta inmediata de 9:00 a 18:00',
    icon: MessageCircle,
    color: 'from-blue-500 to-cyan-500',
    available: true
  },
  {
    title: 'Email Soporte',
    description: 'Respuesta en 24 horas',
    icon: Mail,
    color: 'from-green-500 to-emerald-500',
    available: true
  },
  {
    title: 'Llamada Telefónica',
    description: 'Solo para usuarios PRO',
    icon: Phone,
    color: 'from-purple-500 to-pink-500',
    available: false
  }
]

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('getting-started')
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([])

  const toggleQuestion = (questionIndex: string) => {
    setExpandedQuestions(prev =>
      prev.includes(questionIndex)
        ? prev.filter(q => q !== questionIndex)
        : [...prev, questionIndex]
    )
  }

  const filteredCategories = FAQ_CATEGORIES.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.questions.some(q =>
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const selectedCategoryData = FAQ_CATEGORIES.find(cat => cat.id === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Centro de Ayuda</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Encuentra respuestas rápidas a tus preguntas y aprende a sacar el máximo provecho de ShortsAI
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar en el centro de ayuda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-background border-2 border-border rounded-2xl text-lg focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((action, index) => {
              const Icon = action.icon
              return (
                <Card key={index} className="card-glow border-0 cursor-pointer hover:scale-105 transition-transform">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{action.description}</p>
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <Clock className="w-3 h-3" />
                      {action.time}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card className="card-glow border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Book className="w-5 h-5" />
                  Categorías
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {filteredCategories.map((category) => {
                    const Icon = category.icon
                    const isSelected = selectedCategory === category.id

                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50 ${
                          isSelected ? 'bg-primary/10 border-r-2 border-primary' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <span className={`font-medium ${isSelected ? 'text-primary' : ''}`}>
                          {category.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Content */}
          <div className="lg:col-span-3">
            <Card className="card-glow border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedCategoryData && (
                    <>
                      <selectedCategoryData.icon className="w-5 h-5" />
                      {selectedCategoryData.name}
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCategoryData && (
                  <div className="space-y-4">
                    {selectedCategoryData.questions.map((item, index) => {
                      const questionId = `${selectedCategory}-${index}`
                      const isExpanded = expandedQuestions.includes(questionId)

                      return (
                        <div
                          key={index}
                          className="border border-border rounded-xl overflow-hidden"
                        >
                          <button
                            onClick={() => toggleQuestion(questionId)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                          >
                            <span className="font-medium">{item.question}</span>
                            {isExpanded ? (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="px-4 pb-4 text-muted-foreground">
                              {item.answer}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">¿Necesitas más ayuda?</h2>
            <p className="text-muted-foreground">
              Nuestro equipo de soporte está aquí para ayudarte
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {CONTACT_OPTIONS.map((option, index) => {
              const Icon = option.icon
              return (
                <Card key={index} className={`card-glow border-0 ${option.available ? 'cursor-pointer hover:scale-105' : 'opacity-60'} transition-transform`}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 bg-gradient-to-br ${option.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{option.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{option.description}</p>

                    {option.available ? (
                      <Button className="w-full btn-primary">
                        Contactar
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" disabled>
                        Próximamente
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-12 p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl">
          <div className="text-center mb-6">
            <Star className="w-8 h-8 text-primary mx-auto mb-2" />
            <h3 className="text-xl font-bold mb-2">Recursos Adicionales</h3>
            <p className="text-muted-foreground">
              Expande tus conocimientos con nuestros recursos premium
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <h4 className="font-semibold mb-2">📚 Guías Avanzadas</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Tutoriales detallados para usuarios expertos
              </p>
              <Button variant="outline" size="sm">
                Ver Guías
              </Button>
            </div>

            <div className="text-center">
              <h4 className="font-semibold mb-2">🎥 Video Tutoriales</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Aprende viendo nuestros tutoriales en video
              </p>
              <Button variant="outline" size="sm">
                Ver Videos
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}