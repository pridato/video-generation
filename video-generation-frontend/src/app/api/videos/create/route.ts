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

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      title,
      script,
      templateId,
      voiceId,
      categoria, // Nueva propiedad para la categoría
      enhanceScript = true // Flag para determinar si mejorar el script
    } = await request.json()

    // Validate required fields
    if (!userId || !title || !script || !templateId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check user credits and video limit
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, credits_remaining, videos_used, subscription_tier')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user can create video (has credits remaining)
    const canCreateVideo = profile.credits_remaining > 0

    if (!canCreateVideo) {
      return NextResponse.json(
        {
          error: 'Insufficient credits remaining',
          credits_remaining: profile.credits_remaining
        },
        { status: 403 }
      )
    }

    let enhancedScript = script
    let scriptMetadata = null

    // Mejorar script usando el backend de Python si está habilitado
    if (enhanceScript && categoria) {
      try {
        console.log(`Enviando script para mejora a ${BACKEND_URL}/mejorar-script`)
        
        const scriptResponse = await fetch(`${BACKEND_URL}/mejorar-script`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: script,
            categoria: categoria
          })
        })

        if (!scriptResponse.ok) {
          const errorData = await scriptResponse.json()
          console.error('Error del backend:', errorData)
          
          // Si falla la mejora, continuar con el script original
          console.warn('Falló la mejora del script, usando script original')
        } else {
          const scriptData = await scriptResponse.json()
          enhancedScript = scriptData.script_mejorado
          scriptMetadata = {
            duracion_estimada: scriptData.duracion_estimada,
            segmentos: scriptData.segmentos,
            palabras_clave: scriptData.palabras_clave,
            tono: scriptData.tono,
            mejoras_aplicadas: scriptData.mejoras_aplicadas
          }
          
          console.log(`Script mejorado exitosamente. Duración estimada: ${scriptData.duracion_estimada}s`)
        }
      } catch (error) {
        console.error('Error conectando con backend de mejora:', error)
        // Si falla la conexión, continuar con el script original
        console.warn('No se pudo conectar con el servicio de mejora, usando script original')
      }
    }

    // Create video record in database
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        user_id: userId,
        title: title,
        script: script, // Script original
        enhanced_script: enhancedScript, // Script mejorado (o original si falló)
        script_metadata: scriptMetadata, // Metadatos del script mejorado
        template_id: templateId,
        voice_id: voiceId,
        categoria: categoria, // Guardar categoría
        status: 'processing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (videoError) {
      console.error('Error creating video:', videoError)
      return NextResponse.json(
        { error: 'Failed to create video' },
        { status: 500 }
      )
    }

    // Deduct credit and update usage
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        credits_remaining: profile.credits_remaining - 1,
        videos_used: profile.videos_used + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user usage' },
        { status: 500 }
      )
    }

    // Simular procesamiento de video (aquí iría la lógica real de generación)
    setTimeout(async () => {
      // Simular video processing completion
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          status: 'completed',
          video_url: `https://example.com/videos/${video.id}.mp4`,
          duration: scriptMetadata?.duracion_estimada || Math.floor(Math.random() * 60) + 30,
          updated_at: new Date().toISOString()
        })
        .eq('id', video.id)

      if (updateError) {
        console.error('Error updating video status:', updateError)
      }
    }, 5000) // Simulate 5 second processing time

    return NextResponse.json({
      success: true,
      video: {
        id: video.id,
        title: video.title,
        status: video.status,
        created_at: video.created_at,
        script_original: script,
        script_mejorado: enhancedScript,
        script_metadata: scriptMetadata
      },
      credits_remaining: profile.credits_remaining - 1,
      message: scriptMetadata 
        ? 'Video creation started with enhanced script' 
        : 'Video creation started with original script'
    })

  } catch (error) {
    console.error('Error in video creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}