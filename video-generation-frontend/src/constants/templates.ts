/**
 * Templates and Video Creation Constants
 */

// Template Categories
export const TEMPLATE_CATEGORIES = {
  TECH: {
    id: 'tech',
    name: 'Tecnología',
    description: 'Programación, desarrollo, gadgets y software',
    icon: '💻',
    color: 'from-blue-500 to-cyan-500',
  },
  EDUCATION: {
    id: 'education',
    name: 'Educación',
    description: 'Tutoriales, explicaciones y cursos online',
    icon: '📚',
    color: 'from-green-500 to-teal-500',
  },
  MARKETING: {
    id: 'marketing',
    name: 'Marketing',
    description: 'Promoción, ventas y estrategias de negocio',
    icon: '📈',
    color: 'from-purple-500 to-pink-500',
  },
  ENTERTAINMENT: {
    id: 'entertainment',
    name: 'Entretenimiento',
    description: 'Contenido viral, humor y entretenimiento',
    icon: '🎭',
    color: 'from-orange-500 to-red-500',
  },
  LIFESTYLE: {
    id: 'lifestyle',
    name: 'Estilo de vida',
    description: 'Vida cotidiana, consejos y experiencias',
    icon: '✨',
    color: 'from-pink-500 to-rose-500',
  },
  BUSINESS: {
    id: 'business',
    name: 'Negocios',
    description: 'Emprendimiento, finanzas y productividad',
    icon: '💼',
    color: 'from-gray-600 to-gray-800',
  },
  FITNESS: {
    id: 'fitness',
    name: 'Fitness',
    description: 'Ejercicio, nutrición y vida saludable',
    icon: '💪',
    color: 'from-emerald-500 to-green-600',
  },
  FOOD: {
    id: 'food',
    name: 'Comida',
    description: 'Recetas, cocina y gastronomía',
    icon: '🍳',
    color: 'from-yellow-500 to-orange-500',
  },
  TRAVEL: {
    id: 'travel',
    name: 'Viajes',
    description: 'Destinos, aventuras y experiencias',
    icon: '✈️',
    color: 'from-sky-500 to-blue-600',
  },
  NEWS: {
    id: 'news',
    name: 'Noticias',
    description: 'Actualidad, análisis y reportajes',
    icon: '📺',
    color: 'from-red-600 to-red-800',
  }
} as const

// Video Templates
export const VIDEO_TEMPLATES = [
  {
    id: 'tech-tutorial',
    name: 'Tutorial Tecnológico',
    description: 'Perfecto para tutoriales de código y explicaciones técnicas',
    category: 'tech',
    preview: '🖥️',
    color: 'from-blue-500 to-cyan-500',
    isPremium: false,
    duration: 60,
    tags: ['tutorial', 'programación', 'código'],
  },
  {
    id: 'viral-facts',
    name: 'Datos Virales',
    description: 'Formato atractivo para datos curiosos y trivia',
    category: 'entertainment',
    preview: '🔥',
    color: 'from-orange-500 to-red-500',
    isPremium: false,
    duration: 30,
    tags: ['viral', 'datos', 'curiosidades'],
  },
  {
    id: 'product-demo',
    name: 'Demo de Producto',
    description: 'Presenta tu producto de manera convincente y profesional',
    category: 'business',
    preview: '🚀',
    color: 'from-purple-500 to-pink-500',
    isPremium: true,
    duration: 90,
    tags: ['producto', 'demo', 'ventas'],
  },
  {
    id: 'educational',
    name: 'Educativo',
    description: 'Para explicar conceptos complejos de forma simple',
    category: 'education',
    preview: '📚',
    color: 'from-green-500 to-teal-500',
    isPremium: false,
    duration: 45,
    tags: ['educación', 'aprendizaje', 'conceptos'],
  },
  {
    id: 'fitness-routine',
    name: 'Rutina de Ejercicios',
    description: 'Guías de ejercicios y tips de fitness',
    category: 'fitness',
    preview: '💪',
    color: 'from-emerald-500 to-green-600',
    isPremium: true,
    duration: 75,
    tags: ['fitness', 'ejercicio', 'salud'],
  },
  {
    id: 'recipe-quick',
    name: 'Receta Rápida',
    description: 'Recetas fáciles y deliciosas paso a paso',
    category: 'food',
    preview: '👨‍🍳',
    color: 'from-yellow-500 to-orange-500',
    isPremium: false,
    duration: 30,
    tags: ['cocina', 'recetas', 'comida'],
  }
] as const

// Voice Options
export const VOICE_OPTIONS = [
  {
    id: 'alloy',
    name: 'Alloy',
    description: 'Voz versátil y natural, perfecta para tutoriales',
    preview: '/audio/previews/alloy.mp3',
    gender: 'neutral',
    language: 'ES',
    style: 'professional',
    isPremium: false,
  },
  {
    id: 'echo',
    name: 'Echo',
    description: 'Voz clara y profesional para contenido corporativo',
    preview: '/audio/previews/echo.mp3',
    gender: 'male',
    language: 'ES',
    style: 'corporate',
    isPremium: false,
  },
  {
    id: 'fable',
    name: 'Fable',
    description: 'Voz expresiva ideal para storytelling',
    preview: '/audio/previews/fable.mp3',
    gender: 'neutral',
    language: 'ES',
    style: 'narrative',
    isPremium: true,
  },
  {
    id: 'onyx',
    name: 'Onyx',
    description: 'Voz profunda y autoritaria para contenido serio',
    preview: '/audio/previews/onyx.mp3',
    gender: 'male',
    language: 'ES',
    style: 'authoritative',
    isPremium: false,
  },
  {
    id: 'nova',
    name: 'Nova',
    description: 'Voz femenina cálida y amigable',
    preview: '/audio/previews/nova.mp3',
    gender: 'female',
    language: 'ES',
    style: 'friendly',
    isPremium: true,
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'Voz femenina energética para contenido dinámico',
    preview: '/audio/previews/shimmer.mp3',
    gender: 'female',
    language: 'ES',
    style: 'energetic',
    isPremium: true,
  }
] as const

// Voice Speed Options
export const VOICE_SPEED_OPTIONS = [
  { value: 0.75, label: '0.75x', description: 'Lento y claro' },
  { value: 1.0, label: '1.0x', description: 'Velocidad normal' },
  { value: 1.25, label: '1.25x', description: 'Ligeramente rápido' },
  { value: 1.5, label: '1.5x', description: 'Rápido y dinámico' }
] as const

// Video Quality Options
export const VIDEO_QUALITY_OPTIONS = [
  {
    value: '720p',
    label: 'HD (720p)',
    description: '1280x720 - Buena calidad',
    isPremium: false,
    fileSize: 'medium',
  },
  {
    value: '1080p',
    label: 'Full HD (1080p)',
    description: '1920x1080 - Alta calidad',
    isPremium: true,
    fileSize: 'large',
  },
  {
    value: '4k',
    label: 'Ultra HD (4K)',
    description: '3840x2160 - Máxima calidad',
    isPremium: true,
    fileSize: 'extra_large',
  }
] as const

// Animation Styles
export const ANIMATION_STYLES = {
  NONE: { id: 'none', name: 'Sin animación', isPremium: false },
  FADE: { id: 'fade', name: 'Desvanecimiento', isPremium: false },
  SLIDE: { id: 'slide', name: 'Deslizamiento', isPremium: true },
  ZOOM: { id: 'zoom', name: 'Zoom', isPremium: true },
  BOUNCE: { id: 'bounce', name: 'Rebote', isPremium: true },
} as const

// Color Themes
export const COLOR_THEMES = {
  MODERN: { id: 'modern', name: 'Moderno', colors: ['#000000', '#ffffff', '#3b82f6'] },
  VIBRANT: { id: 'vibrant', name: 'Vibrante', colors: ['#ec4899', '#f59e0b', '#10b981'] },
  PROFESSIONAL: { id: 'professional', name: 'Profesional', colors: ['#1f2937', '#6b7280', '#3b82f6'] },
  WARM: { id: 'warm', name: 'Cálido', colors: ['#dc2626', '#f59e0b', '#fbbf24'] },
  COOL: { id: 'cool', name: 'Fresco', colors: ['#0ea5e9', '#06b6d4', '#10b981'] },
} as const