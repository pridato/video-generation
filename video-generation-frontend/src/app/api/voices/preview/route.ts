import { NextRequest, NextResponse } from 'next/server'
import { getVoiceProfile } from '@/lib/audio-utils'

// URL del backend de Python
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

interface VoicePreviewRequest {
  voiceId: string
  text?: string
  category?: 'professional' | 'energetic' | 'friendly' | 'dramatic' | 'calm'
}

const PREVIEW_TEXTS = {
  professional: "Hola, soy tu asistente de voz profesional. Estoy aquí para ayudarte a crear contenido de alta calidad.",
  energetic: "¡Hola! ¡Soy tu voz llena de energía! ¡Vamos a crear algo increíble juntos!",
  friendly: "Hola, me alegra conocerte. Soy tu voz amigable y estaré encantada de acompañarte en tus proyectos.",
  dramatic: "Saludos. Soy la voz que dará vida a tus historias más cautivadoras y dramáticas.",
  calm: "Hola, soy tu voz tranquila y serena. Perfecto para contenido relajante y meditativo."
}

export async function POST(request: NextRequest) {
  try {
    const { voiceId, text, category }: VoicePreviewRequest = await request.json()

    if (!voiceId) {
      return NextResponse.json(
        { error: 'Se requiere voiceId' },
        { status: 400 }
      )
    }

    // Obtener perfil de voz
    const voiceProfile = getVoiceProfile(voiceId)
    if (!voiceProfile) {
      return NextResponse.json(
        { error: 'Perfil de voz no encontrado' },
        { status: 404 }
      )
    }

    // Determinar texto a usar para el preview
    const previewText = text ||
      PREVIEW_TEXTS[category || voiceProfile.category] ||
      PREVIEW_TEXTS.professional

    console.log(`Generando preview para voz: ${voiceProfile.name} (${voiceId})`)

    // Llamar al backend Python para generar el preview
    const response = await fetch(`${BACKEND_URL}/generar-preview-voz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        voice_id: voiceId,
        text: previewText,
        category: category || voiceProfile.category
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Backend API error:', error)

      return NextResponse.json(
        {
          error: 'Error en el servicio de síntesis de voz',
          details: `Backend API: ${response.status}`
        },
        { status: 502 }
      )
    }

    // El backend debe retornar el audio como base64
    const audioData = await response.json()
    // { "audio_base64": "...", "filename": "preview.mp3" }

    // Convertir base64 a buffer
    const audioBuffer = Buffer.from(audioData.audio_base64, 'base64')

    console.log(`✅ Preview generado para ${voiceProfile.name}: ${audioBuffer.byteLength} bytes`)

    // Retornar el audio directamente
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        'X-Voice-Profile': voiceProfile.name,
        'X-Voice-Category': voiceProfile.category,
        'X-Preview-Text': previewText.substring(0, 100)
      },
    })

  } catch (error) {
    console.error('Error en preview de voz:', error)

    let errorMessage = 'Error interno del servidor'
    let statusCode = 500

    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Error de conexión con el backend'
        statusCode = 503
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: statusCode }
    )
  }
}

// Endpoint GET para obtener información de voces disponibles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const language = searchParams.get('language') || 'es'

    // Importar perfiles de voz
    const { VOICE_PROFILES } = await import('@/lib/audio-utils')

    let voices = VOICE_PROFILES.filter(voice => voice.language === language)

    if (category) {
      voices = voices.filter(voice => voice.category === category)
    }

    const voicesWithMetadata = voices.map(voice => ({
      id: voice.id,
      name: voice.name,
      category: voice.category,
      gender: voice.gender,
      age_range: voice.age_range,
      description: voice.description,
      accent: voice.accent,
      preview_available: true
    }))

    return NextResponse.json({
      voices: voicesWithMetadata,
      total: voicesWithMetadata.length,
      language,
      categories: ['professional', 'energetic', 'friendly', 'dramatic', 'calm']
    })

  } catch (error) {
    console.error('Error obteniendo voces:', error)
    return NextResponse.json(
      { error: 'Error al obtener lista de voces' },
      { status: 500 }
    )
  }
}