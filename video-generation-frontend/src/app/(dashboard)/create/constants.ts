import { FileText, Wand2, Palette, Mic, Clapperboard } from 'lucide-react'
import { Template, Voice, SpeedOption, Categoria, Step } from './types'

export const STEPS: Step[] = [
  { id: 1, title: 'Script', icon: FileText },
  { id: 2, title: 'IA', icon: Wand2 },
  { id: 3, title: 'Voz + Clips', icon: Mic },
  { id: 4, title: 'Resumen', icon: Clapperboard }
]

export const TEMPLATES: Template[] = [
  {
    id: 'tech-tutorial',
    name: 'Tutorial Tecnológico',
    description: 'Perfecto para tutoriales de código y explicaciones técnicas',
    preview: '🖥️',
    color: 'from-blue-500 to-cyan-500',
    isPremium: false
  },
  {
    id: 'viral-facts',
    name: 'Datos Virales',
    description: 'Formato atractivo para datos curiosos y trivia',
    preview: '🔥',
    color: 'from-orange-500 to-red-500',
    isPremium: false
  },
  {
    id: 'product-demo',
    name: 'Demo de Producto',
    description: 'Presenta tu producto de manera convincente y profesional',
    preview: '🚀',
    color: 'from-purple-500 to-pink-500',
    isPremium: true
  },
  {
    id: 'educational',
    name: 'Educativo',
    description: 'Para explicar conceptos complejos de forma simple',
    preview: '📚',
    color: 'from-green-500 to-teal-500',
    isPremium: false
  }
]

export const VOICES: Voice[] = [
  {
    id: 'alloy',
    name: 'Alloy',
    description: 'Voz versátil y natural, perfecta para tutoriales',
    preview: '/audio/previews/alloy.mp3',
    gender: 'male',
    language: 'ES'
  },
  {
    id: 'echo',
    name: 'Echo',
    description: 'Voz clara y profesional para contenido corporativo',
    preview: '/audio/previews/echo.mp3',
    gender: 'male',
    language: 'ES'
  },
  {
    id: 'fable',
    name: 'Fable',
    description: 'Voz expresiva ideal para storytelling',
    preview: '/audio/previews/fable.mp3',
    gender: 'male',
    language: 'ES'
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Voz profunda y autoritaria para contenido serio',
    preview: '/audio/previews/onyx.mp3',
    gender: 'male',
    language: 'ES'
  },
  {
    id: 'nova',
    name: 'Nova',
    description: 'Voz femenina cálida y amigable',
    preview: '/audio/previews/nova.mp3',
    gender: 'female',
    language: 'ES'
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'Voz femenina energética para contenido dinámico',
    preview: '/audio/previews/shimmer.mp3',
    gender: 'female',
    language: 'ES'
  }
]

export const SPEED_OPTIONS: SpeedOption[] = [
  { value: 0.75, label: '0.75x', description: 'Lento' },
  { value: 1.0, label: '1.0x', description: 'Normal' },
  { value: 1.25, label: '1.25x', description: 'Rápido' },
  { value: 1.5, label: '1.5x', description: 'Muy rápido' }
]

export const CATEGORIAS: Categoria[] = [
  {
    id: 'tech',
    name: 'Tecnología',
    description: 'Programación, desarrollo, gadgets y software',
    icon: '💻'
  },
  {
    id: 'education',
    name: 'Educación',
    description: 'Tutoriales, explicaciones y cursos online',
    icon: '📚'
  },
  {
    id: 'fitness',
    name: 'Fitness',
    description: 'Ejercicio, nutrición y vida saludable',
    icon: '💪'
  },
  {
    id: 'food',
    name: 'Comida',
    description: 'Recetas, cocina y gastronomía',
    icon: '🍳'
  }
]