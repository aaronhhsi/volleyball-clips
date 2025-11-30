'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddClipForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    instagram_url: '',
    players: '',
    events: '',
    tournament: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Split players and events into arrays
    const playerArray = formData.players
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)

    const eventArray = formData.events
      .split(',')
      .map(ev => ev.trim())
      .filter(ev => ev.length > 0)

    // Pair first player with first event, second player with second event, etc.
    const maxLength = Math.max(playerArray.length, eventArray.length)
    const player_events = Array.from({ length: maxLength }).map((_, i) => ({
      player: playerArray[i] || null,
      event: eventArray[i] || null
    }))

    try {
      const response = await fetch('/api/clips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instagram_url: formData.instagram_url,
        player_events,
        players: playerArray,      // <-- add this
        tournament: formData.tournament
      })
    })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add clip')
      }

      // Reset form
      setFormData({
        instagram_url: '',
        players: '',
        events: '',
        tournament: ''
      })

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 relative bg-[#0d0f13] text-gray-200 p-6 rounded-xl shadow-xl border border-gray-800">

      {loading && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded-xl backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded">
          {error}
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
          className="w-full px-4 py-2 bg-[#1a1d23] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-100 placeholder-gray-500"
          disabled={loading}
        />
      </div>

      {/* Players */}
      <div>
        <label htmlFor="players" className="block text-sm font-medium mb-2">
          Players (comma separated)
        </label>
        <input
          type="text"
          id="players"
          name="players"
          value={formData.players}
          onChange={handleChange}
          placeholder="John Smith, Aaron Miller"
          className="w-full px-4 py-2 bg-[#1a1d23] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-100 placeholder-gray-500"
          disabled={loading}
        />
      </div>

      {/* Events */}
      <div>
        <label htmlFor="events" className="block text-sm font-medium mb-2">
          Events (comma separated)
        </label>
        <input
          type="text"
          id="events"
          name="events"
          value={formData.events}
          onChange={handleChange}
          placeholder="serve, kill, dig, block, set"
          className="w-full px-4 py-2 bg-[#1a1d23] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-100 placeholder-gray-500"
          disabled={loading}
        />
      </div>

      {/* Tournament */}
      <div>
        <label htmlFor="tournament" className="block text-sm font-medium mb-2 text-gray-300">
          Tournament/League
        </label>
        <input
          type="text"
          id="tournament"
          name="tournament"
          value={formData.tournament}
          onChange={handleChange}
          placeholder="VNL 2025"
          className="w-full px-4 py-2 bg-[#1a1d23] border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-100 placeholder-gray-500"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-700 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium disabled:bg-gray-500 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
        {loading ? 'Adding Clip...' : 'Add Clip'}
      </button>
    </form>
  )
}
