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
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('credits, videos_used, subscription_tier')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user can create video (has credits or subscription)
    const canCreateVideo = user.credits > 0 || user.subscription_tier !== 'FREE'

    if (!canCreateVideo) {
      return NextResponse.json(
        { error: 'Insufficient credits or subscription required' },
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

    // Deduct credit if user is using credits (not subscription)
    if (user.subscription_tier === 'FREE' && user.credits > 0) {
      const { error: creditError } = await supabase
        .from('users')
        .update({
          credits: user.credits - 1,
          videos_used: user.videos_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (creditError) {
        console.error('Error updating user credits:', creditError)
      }
    } else {
      // Just update videos_used for subscription users
      const { error: usageError } = await supabase
        .from('users')
        .update({
          videos_used: user.videos_used + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (usageError) {
        console.error('Error updating user usage:', usageError)
      }
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
      }
    })

  } catch (error) {
    console.error('Error in video creation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}