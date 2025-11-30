import { NextRequest, NextResponse } from 'next/server'
import { downloadVideo } from '@/lib/downloadAndUploadClip'

export async function POST(req: NextRequest) {
  try {
    const { instagramUrl } = await req.json()
    console.log("Received download request for:", instagramUrl)

    const video_url = await downloadVideo(instagramUrl)
    console.log("Returning video_url:", video_url)
    return NextResponse.json({ video_url })
  } catch (err: any) {
    console.error("download-video route failed:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
