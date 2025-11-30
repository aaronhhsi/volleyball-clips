import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: { filename: string } } // do NOT destructure yet
) {
  // Await params if necessary (App Router new behavior)
  const params = await context.params
  const filename = params.filename

  const videoUrl = `https://ftszwkmfkxxjngvkzefi.supabase.co/storage/v1/object/public/clips/${filename}`

  try {
    const response = await fetch(videoUrl)

    if (!response.ok) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'video/mp4',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Accept-Ranges': 'bytes',
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
  }
}
