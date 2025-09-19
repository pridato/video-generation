export interface VoiceProfile {
  id: string
  name: string
  category: 'professional' | 'casual' | 'energetic' | 'calm' | 'dramatic'
  language: 'es' | 'en'
  gender: 'male' | 'female' | 'neutral'
  age_range: 'young' | 'adult' | 'mature'
  accent?: string
  description: string
  sample_url?: string
  openai_id: string
}

export interface AudioSegmentSettings {
  stability: number
  similarity_boost: number
  style: number
  use_speaker_boost: boolean
  speed_factor?: number
}

export interface ScriptSegment {
  text: string
  type: 'intro' | 'content' | 'conclusion' | 'transition' | 'emphasis' | 'question'
  emotion: 'neutral' | 'excited' | 'serious' | 'friendly' | 'dramatic' | 'mysterious'
  priority: 'low' | 'medium' | 'high'
  duration_estimate: number
  pause_after: number
  voice_settings: AudioSegmentSettings
}

export const VOICE_PROFILES: VoiceProfile[] = [
  {
    id: 'alloy',
    name: 'Alloy',
    category: 'professional',
    language: 'es',
    gender: 'neutral',
    age_range: 'adult',
    accent: 'neutral',
    description: 'Voz profesional y clara, ideal para contenido educativo y corporativo',
    openai_id: 'alloy'
  },
  {
    id: 'echo',
    name: 'Echo',
    category: 'energetic',
    language: 'es',
    gender: 'male',
    age_range: 'adult',
    description: 'Voz enérgica y dinámica, perfecta para contenido motivacional',
    openai_id: 'echo'
  },
  {
    id: 'fable',
    name: 'Fable',
    category: 'friendly',
    language: 'es',
    gender: 'neutral',
    age_range: 'adult',
    description: 'Voz amigable y cálida, ideal para tutoriales y contenido casual',
    openai_id: 'fable'
  },
  {
    id: 'onyx',
    name: 'Onyx',
    category: 'dramatic',
    language: 'es',
    gender: 'male',
    age_range: 'mature',
    description: 'Voz profunda y dramática, perfecta para narrativas y documentales',
    openai_id: 'onyx'
  },
  {
    id: 'nova',
    name: 'Nova',
    category: 'energetic',
    language: 'es',
    gender: 'female',
    age_range: 'young',
    description: 'Voz juvenil y vibrante, ideal para contenido dinámico y entretenido',
    openai_id: 'nova'
  },
  {
    id: 'shimmer',
    name: 'Shimmer',
    category: 'calm',
    language: 'es',
    gender: 'female',
    age_range: 'adult',
    description: 'Voz suave y relajante, perfecta para contenido meditativo y ASMR',
    openai_id: 'shimmer'
  }
]

export const BASE_VOICE_SETTINGS: Record<string, AudioSegmentSettings> = {
  professional: {
    stability: 0.6,
    similarity_boost: 0.85,
    style: 0.1,
    use_speaker_boost: true
  },
  energetic: {
    stability: 0.4,
    similarity_boost: 0.75,
    style: 0.4,
    use_speaker_boost: true
  },
  friendly: {
    stability: 0.5,
    similarity_boost: 0.8,
    style: 0.2,
    use_speaker_boost: true
  },
  dramatic: {
    stability: 0.7,
    similarity_boost: 0.9,
    style: 0.6,
    use_speaker_boost: true
  },
  calm: {
    stability: 0.8,
    similarity_boost: 0.85,
    style: 0.1,
    use_speaker_boost: false
  }
}

export const SEGMENT_TYPE_SETTINGS: Record<ScriptSegment['type'], Partial<AudioSegmentSettings>> = {
  intro: {
    stability: 0.6,
    style: 0.2,
    speed_factor: 0.9
  },
  content: {
    stability: 0.5,
    style: 0.1,
    speed_factor: 1.0
  },
  conclusion: {
    stability: 0.7,
    style: 0.15,
    speed_factor: 0.85
  },
  transition: {
    stability: 0.4,
    style: 0.3,
    speed_factor: 1.1
  },
  emphasis: {
    stability: 0.3,
    style: 0.5,
    speed_factor: 0.8
  },
  question: {
    stability: 0.4,
    style: 0.4,
    speed_factor: 0.9
  }
}

export const EMOTION_MODIFIERS: Record<ScriptSegment['emotion'], Partial<AudioSegmentSettings>> = {
  neutral: {},
  excited: {
    stability: 0.3,
    style: 0.6
  },
  serious: {
    stability: 0.8,
    style: 0.1
  },
  friendly: {
    stability: 0.5,
    style: 0.3
  },
  dramatic: {
    stability: 0.6,
    style: 0.8
  },
  mysterious: {
    stability: 0.7,
    style: 0.5
  }
}

export function analyzeScriptContent(script: string): ScriptSegment[] {
  const sentences = script
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)

  return sentences.map((sentence, index) => {
    const segment = analyzeIndividualSegment(sentence, index, sentences.length)
    return {
      ...segment,
      voice_settings: calculateVoiceSettings(segment),
      duration_estimate: estimateSegmentDuration(sentence),
      pause_after: calculatePause(segment, index, sentences.length)
    }
  })
}

function analyzeIndividualSegment(
  text: string,
  index: number,
  totalSegments: number
): Omit<ScriptSegment, 'voice_settings' | 'duration_estimate' | 'pause_after'> {
  const lowerText = text.toLowerCase()

  // Determinar tipo de segmento
  let type: ScriptSegment['type'] = 'content'

  if (index === 0) {
    type = 'intro'
  } else if (index === totalSegments - 1) {
    type = 'conclusion'
  } else if (lowerText.match(/\b(pero|sin embargo|además|ahora|entonces|luego)\b/)) {
    type = 'transition'
  } else if (text.includes('?')) {
    type = 'question'
  } else if (lowerText.match(/\b(importante|clave|fundamental|esencial|crítico)\b/) || text.includes('!')) {
    type = 'emphasis'
  }

  // Determinar emoción
  let emotion: ScriptSegment['emotion'] = 'neutral'

  if (lowerText.match(/\b(genial|fantástico|increíble|amazing|excelente)\b/)) {
    emotion = 'excited'
  } else if (lowerText.match(/\b(importante|serio|grave|crítico|cuidado)\b/)) {
    emotion = 'serious'
  } else if (lowerText.match(/\b(hola|bienvenido|gracias|perfecto)\b/)) {
    emotion = 'friendly'
  } else if (lowerText.match(/\b(misterioso|secreto|oculto|desconocido)\b/)) {
    emotion = 'mysterious'
  } else if (lowerText.match(/\b(dramático|intenso|poderoso|impactante)\b/)) {
    emotion = 'dramatic'
  }

  // Determinar prioridad
  let priority: ScriptSegment['priority'] = 'medium'

  if (type === 'intro' || type === 'conclusion' || type === 'emphasis') {
    priority = 'high'
  } else if (type === 'transition') {
    priority = 'low'
  }

  return {
    text,
    type,
    emotion,
    priority
  }
}

function calculateVoiceSettings(segment: ScriptSegment): AudioSegmentSettings {
  // Comenzar con settings base para voz profesional
  const baseSettings = { ...BASE_VOICE_SETTINGS.professional }

  // Aplicar modificadores por tipo de segmento
  const typeModifiers = SEGMENT_TYPE_SETTINGS[segment.type]
  Object.assign(baseSettings, typeModifiers)

  // Aplicar modificadores por emoción
  const emotionModifiers = EMOTION_MODIFIERS[segment.emotion]
  Object.assign(baseSettings, emotionModifiers)

  // Asegurar que los valores estén en rangos válidos
  return {
    stability: Math.max(0.1, Math.min(1.0, baseSettings.stability)),
    similarity_boost: Math.max(0.1, Math.min(1.0, baseSettings.similarity_boost)),
    style: Math.max(0.0, Math.min(1.0, baseSettings.style)),
    use_speaker_boost: baseSettings.use_speaker_boost,
    speed_factor: baseSettings.speed_factor || 1.0
  }
}

function estimateSegmentDuration(text: string): number {
  // Estimación aproximada: 150 palabras por minuto en español
  const words = text.split(/\s+/).length
  const baseWPM = 150
  return (words / baseWPM) * 60 // Retornar en segundos
}

function calculatePause(
  segment: ScriptSegment,
  index: number,
  totalSegments: number
): number {
  let pause = 0.5 // Pausa base

  // Ajustar según tipo de segmento
  switch (segment.type) {
    case 'intro':
      pause = 0.8
      break
    case 'conclusion':
      pause = 1.0
      break
    case 'emphasis':
      pause = 0.7
      break
    case 'question':
      pause = 0.6
      break
    case 'transition':
      pause = 0.4
      break
  }

  // Pausa más larga después de segmentos importantes
  if (segment.priority === 'high') {
    pause += 0.2
  }

  // Sin pausa después del último segmento
  if (index === totalSegments - 1) {
    pause = 0
  }

  return pause
}

export function getVoiceProfile(voiceId: string): VoiceProfile | undefined {
  return VOICE_PROFILES.find(profile => profile.id === voiceId)
}


export function optimizeVoiceSettingsForProfile(
  settings: AudioSegmentSettings,
  voiceProfile: VoiceProfile
): AudioSegmentSettings {
  const optimized = { ...settings }

  // Ajustar settings según la categoría de voz
  switch (voiceProfile.category) {
    case 'energetic':
      optimized.stability = Math.max(0.2, optimized.stability - 0.1)
      optimized.style = Math.min(0.8, optimized.style + 0.2)
      break
    case 'calm':
      optimized.stability = Math.min(0.9, optimized.stability + 0.2)
      optimized.style = Math.max(0.0, optimized.style - 0.1)
      break
    case 'dramatic':
      optimized.style = Math.min(1.0, optimized.style + 0.3)
      optimized.similarity_boost = Math.min(1.0, optimized.similarity_boost + 0.1)
      break
  }

  return optimized
}

export function calculateTotalAudioDuration(segments: ScriptSegment[]): number {
  return segments.reduce((total, segment) => {
    return total + segment.duration_estimate + segment.pause_after
  }, 0)
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}