import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
)

// URL del backend de Python
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

interface VoiceSegment {
  text: string
  type: 'intro' | 'content' | 'conclusion' | 'transition' | 'emphasis'
  emotion?: 'neutral' | 'excited' | 'serious' | 'friendly' | 'dramatic'
  speed?: number
  pause_after?: number
}

interface AudioGenerationRequest {
  script: string
  voiceId: string
  videoId: string
  userId: string
  enhancedScript?: {
    segmentos?: Array<{
      texto: string
      tipo: string
      emocion?: string
      velocidad?: number
      pausa_despues?: number
    }>
  }
}



export async function POST(request: NextRequest) {
  try {
    const { script, voiceId, videoId, userId, enhancedScript }: AudioGenerationRequest = await request.json()

    // Validar campos requeridos
    if (!script || !voiceId || !videoId || !userId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: script, voiceId, videoId, userId' },
        { status: 400 }
      )
    }

    // Verificar que el video existe y pertenece al usuario
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, status, user_id')
      .eq('id', videoId)
      .eq('user_id', userId)
      .single()

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video no encontrado o no autorizado' },
        { status: 404 }
      )
    }

    console.log(`Enviando solicitud de audio al backend: ${BACKEND_URL}/generar-audio`)
    console.log('🎵 Enhanced script con segmentos:', JSON.stringify(enhancedScript, null, 2))

    // Llamar al backend Python para generar el audio
    const backendResponse = await fetch(`${BACKEND_URL}/generar-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: script,
        voice_id: voiceId,
        video_id: videoId,
        enhanced_script: enhancedScript
      })
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      console.error('Error del backend:', errorData)

      return NextResponse.json(
        {
          error: 'Error en el servicio de generación de audio',
          details: errorData.detail || 'Error desconocido del backend'
        },
        { status: 502 }
      )
    }

    const audioData = await backendResponse.json()

    // El backend debe retornar:
    // {
    //   "audio_base64": "base64_encoded_audio",
    //   "segments": [...],
    //   "filename": "audio_xxx.mp3",
    //   "duration": 45.2
    // }

    // Convertir base64 a buffer
    const audioBuffer = Buffer.from(audioData.audio_base64, 'base64')

    // Subir a Supabase Storage
    const audioFileName = audioData.filename || `audio_${videoId}_${Date.now()}.mp3`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('video-assets')
      .upload(`audio/${audioFileName}`, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: false
      })

    if (uploadError) {
      console.error('Error subiendo audio:', uploadError)
      throw new Error('Error al subir el archivo de audio')
    }

    // Obtener URL pública del audio
    const { data: { publicUrl } } = supabase.storage
      .from('video-assets')
      .getPublicUrl(`audio/${audioFileName}`)

    // Actualizar video con la URL del audio
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        audio_url: publicUrl,
        audio_segments: audioData.segments || [],
        voice_settings: {
          voice_id: voiceId,
          segments_count: audioData.segments?.length || 0,
          total_duration: audioData.duration || 0
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', videoId)

    if (updateError) {
      console.error('Error actualizando video:', updateError)
      // No fallar completamente, el audio ya fue generado
    }

    console.log(`🎉 Audio generado exitosamente: ${audioFileName}`)

    return NextResponse.json({
      success: true,
      audio: {
        url: publicUrl,
        filename: audioFileName,
        segments_count: audioData.segments?.length || 0,
        voice_id: voiceId,
        duration: audioData.duration || 0
      },
      segments: audioData.segments || [],
      message: `Audio generado usando voz ${voiceId} desde backend`
    })

  } catch (error) {
    console.error('Error en generación de audio:', error)

    // Determinar tipo de error para respuesta más específica
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