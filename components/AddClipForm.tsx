'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:shorts\/|watch\?v=)|youtu\.be\/)([^?&\s/]+)/
  )
  return match ? match[1] : null
}

export default function AddClipForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    youtube_url: '',
    players: '',
    events: '',
    tournament: '',
  })

  const previewId = extractYouTubeId(formData.youtube_url)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!previewId) {
      setError('Could not extract a YouTube video ID from that URL.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/add-clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add clip')
      }

      setSuccess('Clip added!')
      setFormData({ youtube_url: '', players: '', events: '', tournament: '' })
      setTimeout(() => router.push('/'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2 bg-[#1a1d23] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-100 placeholder-gray-500 disabled:opacity-50'

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto space-y-6 relative bg-[#0d0f13] text-gray-200 p-6 rounded-xl shadow-xl border border-gray-800"
    >
      {loading && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded-xl backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-900/40 border border-green-700 text-green-300 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* YouTube URL */}
      <div>
        <label htmlFor="youtube_url" className="block text-sm font-medium mb-2 text-gray-300">
          YouTube Shorts URL *
        </label>
        <input
          type="url"
          id="youtube_url"
          name="youtube_url"
          required
          value={formData.youtube_url}
          onChange={handleChange}
          placeholder="https://youtube.com/shorts/..."
          className={inputClass}
          disabled={loading}
        />
        {formData.youtube_url && (
          <p className={`mt-1 text-xs ${previewId ? 'text-green-400' : 'text-red-400'}`}>
            {previewId ? `Video ID: ${previewId}` : 'Could not detect a YouTube video ID'}
          </p>
        )}
      </div>

      {/* Thumbnail preview */}
      {previewId && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://img.youtube.com/vi/${previewId}/hqdefault.jpg`}
            alt="YouTube thumbnail"
            className="rounded-lg w-48 border border-gray-700"
          />
        </div>
      )}

      {/* Players */}
      <div>
        <label htmlFor="players" className="block text-sm font-medium mb-2 text-gray-300">
          Players (comma separated)
        </label>
        <input
          type="text"
          id="players"
          name="players"
          value={formData.players}
          onChange={handleChange}
          placeholder="John Smith, Aaron Miller"
          className={inputClass}
          disabled={loading}
        />
      </div>

      {/* Events */}
      <div>
        <label htmlFor="events" className="block text-sm font-medium mb-2 text-gray-300">
          Events (comma separated, paired with players above)
        </label>
        <input
          type="text"
          id="events"
          name="events"
          value={formData.events}
          onChange={handleChange}
          placeholder="kill, block, dig"
          className={inputClass}
          disabled={loading}
        />
        <p className="mt-1 text-xs text-gray-500">
          First event is paired with first player, second with second, etc.
        </p>
      </div>

      {/* Tournament */}
      <div>
        <label htmlFor="tournament" className="block text-sm font-medium mb-2 text-gray-300">
          Tournament / League
        </label>
        <input
          type="text"
          id="tournament"
          name="tournament"
          value={formData.tournament}
          onChange={handleChange}
          placeholder="VNL 2025"
          className={inputClass}
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !previewId}
        className="w-full bg-blue-700 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium disabled:bg-gray-600 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {loading && (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {loading ? 'Adding...' : 'Add Clip'}
      </button>
    </form>
  )
}
