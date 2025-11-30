import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

const execPromise = promisify(exec)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

async function compressWithFfmpeg(inputPath: string, outputPath: string) {
  const cmd = `ffmpeg -y -i "${inputPath}" -c:v libx264 -preset fast -crf 28 -vf "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease,pad=ceil(iw/2)*2:ceil(ih/2)*2" -c:a aac -b:a 96k "${outputPath}"`
  await execPromise(cmd, { timeout: 120000 })
}

export async function downloadVideo(instagramUrl: string): Promise<string> {
  console.log("Starting download for:", instagramUrl)

  // Extract reel ID (the unique part after /reel/ or /p/)
  const urlParts = instagramUrl.split('/').filter(Boolean)
  const lastPart = urlParts.pop() || ''
  const reelId = lastPart.includes('?') ? lastPart.split('?')[0] : lastPart
  if (!reelId) throw new Error('Could not extract reel ID from URL')

  const tempDir = path.join(process.cwd(), 'temp')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  const rawPath = path.join(tempDir, `${reelId}-raw.mp4`)
  const outPath = path.join(tempDir, `${reelId}.mp4`)
  const bucket = 'clips'
  const uploadPath = `${reelId}.mp4`

  // ✅ Check if file already exists in storage
  const { data: files, error: listError } = await supabaseAdmin.storage
    .from(bucket)
    .list('') // list root of bucket
  if (listError) throw listError

  const exists = files?.some(f => f.name === uploadPath)
  if (exists) {
    console.log("File already exists in storage:", uploadPath)
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(uploadPath)
    return data.publicUrl
  }

  // Download video
  try {
    console.log("Downloading to:", rawPath)
    const downloadCmd = `yt-dlp --no-playlist --socket-timeout 30 -f mp4 -o "${rawPath}" "${instagramUrl}"`
    await execPromise(downloadCmd)
    console.log("Download complete")
  } catch (err) {
    console.error("yt-dlp download failed:", err)
    throw err
  }

  // Compress video
  try {
    console.log("Compressing video to:", outPath)
    await compressWithFfmpeg(rawPath, outPath)
    console.log("Compression complete")
  } catch (err) {
    console.error("FFmpeg compression failed:", err)
    throw err
  }

  // Upload video
  try {
    console.log("Uploading to bucket:", uploadPath)
    const fileBuffer = fs.readFileSync(outPath)
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(uploadPath, fileBuffer, { contentType: 'video/mp4', upsert: true })

    if (uploadError) throw uploadError

    const { data: uploadedPublicData } = supabaseAdmin.storage.from(bucket).getPublicUrl(uploadPath)
    fs.unlinkSync(rawPath)
    fs.unlinkSync(outPath)

    if (!uploadedPublicData?.publicUrl) throw new Error('Failed to get public URL')
    console.log("Upload successful, public URL:", uploadedPublicData.publicUrl)
    return uploadedPublicData.publicUrl
  } catch (err) {
    console.error("Upload failed:", err)
    throw err
  }
}
