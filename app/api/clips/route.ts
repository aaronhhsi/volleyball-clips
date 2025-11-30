import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { downloadVideo } from '@/lib/downloadAndUploadClip'

export async function POST(req: NextRequest) {
  const body = await req.json()
  try {
    // 1️⃣ Download and upload video
    const video_url = await downloadVideo(body.instagram_url)

    // 2️⃣ Insert clip into Supabase
    const { data, error } = await supabase
      .from('clips')
      .insert({
        video_url,
        player_events: body.player_events,
        tournament: body.tournament,
        instagram_url: body.instagram_url
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('clips')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
