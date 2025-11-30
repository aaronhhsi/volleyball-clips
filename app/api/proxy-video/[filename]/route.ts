import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params // ✅ Await the params

    const videoUrl = `https://ftszwkmfkxxjngvkzefi.supabase.co/storage/v1/object/public/clips/${filename}`

    const response = await fetch(videoUrl)

    if (!response.ok) {
      return new NextResponse('Video not found', { status: 404 })
    }

    const body = response.body
    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'public, max-age=86400, immutable')

    return new NextResponse(body, {
      status: 200,
      headers
    })
  } catch (err) {
    console.error('proxy error', err)
    return new NextResponse('Internal error', { status: 500 })
  }
}