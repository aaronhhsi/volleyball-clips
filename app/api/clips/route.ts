import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('clips')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error

    const clipsWithFilename = data.map(clip => {
      // YouTube-only clips have no Supabase video_url
      if (!clip.video_url) return clip

      // Extract filename from Supabase storage URL
      const filename = clip.video_url.split('/clips/')[1] // e.g., DLVkKefvn0E.mp4
      return {
        ...clip,
        filename,
        video_url: `/api/proxy-video/${filename}`
      }
    })

    return NextResponse.json(clipsWithFilename)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
