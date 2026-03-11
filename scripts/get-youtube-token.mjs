// Run with: node scripts/get-youtube-token.mjs
// Requires YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET in .env.local

import { google } from 'googleapis'
import http from 'http'
import { URL } from 'url'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Load .env.local manually
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.join(__dirname, '..', '.env.local')
const envContents = fs.readFileSync(envPath, 'utf8')
envContents.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
})

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET
const REDIRECT_URI = 'http://localhost:3333/callback'

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('YOUTUBE_CLIENT_ID or YOUTUBE_CLIENT_SECRET missing from .env.local')
  process.exit(1)
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/youtube.upload'],
  prompt: 'consent', // ensures a refresh token is always returned
})

console.log('\nFirst, make sure this redirect URI is added to your OAuth client in Google Cloud Console:')
console.log('  http://localhost:3333/callback')
console.log('\nThen open this URL in your browser:\n')
console.log(authUrl)
console.log('\nWaiting for callback...')

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3333')
  const code = url.searchParams.get('code')

  if (!code) {
    res.end('No authorization code found.')
    return
  }

  try {
    const { tokens } = await oauth2Client.getToken(code)
    res.end('<h2>Success! Check your terminal for the refresh token.</h2>')
    console.log('\n✅ Add this to your .env.local:')
    console.log(`YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`)
    server.close()
  } catch (err) {
    res.end('Error: ' + err.message)
    console.error('Token exchange failed:', err.message)
    server.close()
  }
})

server.listen(3333)
