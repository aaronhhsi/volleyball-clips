'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddClipForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    instagram_url: '',
    players: '',
    events: '',
    teams: '',
    tournament: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.instagram_url.includes('instagram.com/reel')) {
      setError('Please enter a valid Instagram reel URL.')
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

      setSuccess('Clip uploaded to YouTube and saved!')
      setFormData({ instagram_url: '', players: '', events: '', teams: '', tournament: '' })
      setTimeout(() => router.push('/'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2 bg-[#1a1d23] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-white placeholder-gray-400 disabled:opacity-50'

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto space-y-6 relative bg-[#0d0f13] text-gray-200 p-6 rounded-xl shadow-xl border border-gray-800"
    >
      {loading && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-50 rounded-xl backdrop-blur-sm gap-4">
          <div className="w-12 h-12 border-4 border-gray-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-300 text-sm">Downloading and uploading to YouTube… this may take a minute.</p>
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

      {/* Instagram URL */}
      <div>
        <label htmlFor="instagram_url" className="block text-sm font-medium mb-2 text-gray-300">
          Instagram Reel URL *
        </label>
        <input
          type="url"
          id="instagram_url"
          name="instagram_url"
          required
          value={formData.instagram_url}
          onChange={handleChange}
          placeholder="https://www.instagram.com/reel/..."
          className={inputClass}
          disabled={loading}
        />
      </div>

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
          Events (comma separated, paired with players)
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

      {/* Teams */}
      <div>
        <label htmlFor="teams" className="block text-sm font-medium mb-2 text-gray-300">
          Teams (comma separated, paired with players)
        </label>
        <input
          type="text"
          id="teams"
          name="teams"
          value={formData.teams}
          onChange={handleChange}
          placeholder="BYU, UCLA"
          className={inputClass}
          disabled={loading}
        />
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
          placeholder="NCAA 2025"
          className={inputClass}
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium disabled:bg-gray-600 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {loading && (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {loading ? 'Processing...' : 'Add Clip'}
      </button>
    </form>
  )
}
