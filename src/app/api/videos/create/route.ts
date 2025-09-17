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

export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      title,
      script,
      templateId,
      voiceId,
      enhancedScript
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

    // Create video record in database
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        user_id: userId,
        title: title,
        script: script,
        enhanced_script: enhancedScript,
        template_id: templateId,
        voice_id: voiceId,
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
        usage_count: (profile.usage_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user credits' },
        { status: 500 }
      )
    }

    // Here you would typically trigger the actual video generation process
    // For now, we'll simulate it with a timeout
    setTimeout(async () => {
      // Simulate video processing completion
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          status: 'completed',
          video_url: `https://example.com/videos/${video.id}.mp4`,
          duration: Math.floor(Math.random() * 60) + 30, // Random duration 30-90s
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
        created_at: video.created_at
      },
      credits_remaining: profile.credits_remaining - 1,
      message: 'Video creation started successfully'
    })

  } catch (error) {
    console.error('Error in video creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}