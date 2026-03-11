'use client'

import { useEffect, useState } from 'react'
import { Clip } from '@/lib/types'
import { Trie } from '@/lib/trie'
import PlayerSearch from '@/components/PlayerSearch'
import YouTubeFeed from '@/components/YouTubeFeed'

export default function Home() {
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)
  const [globalMute, setGlobalMute] = useState(true)
  const [playerFilter, setPlayerFilter] = useState<string>('')
  const [trie, setTrie] = useState<Trie | null>(null)

  useEffect(() => {
    fetchClips()
  }, [])

  const fetchClips = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/clips')
      const data: Clip[] = await response.json()
      setClips(data)

      const t = new Trie()
      data.forEach((clip: Clip) => {
        clip.player_names?.forEach(name => t.insert(name))
        if (clip.tournament) t.insert(clip.tournament)
      })
      setTrie(t)
    } catch (error) {
      console.error('Error fetching clips:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredClips = playerFilter
    ? clips.filter(clip =>
        clip.player_names?.some(n => n.toLowerCase() === playerFilter.toLowerCase()) ||
        clip.tournament?.toLowerCase() === playerFilter.toLowerCase()
      )
    : clips

  if (loading) return <LoadingScreen message="Loading clips..." />
  if (clips.length === 0) return <EmptyScreen />

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Header
        globalMute={globalMute}
        toggleGlobalMute={() => setGlobalMute(!globalMute)}
        trie={trie}
        playerFilter={playerFilter}
        onPlayerFilter={setPlayerFilter}
      />

      {filteredClips.length === 0 ? (
        <div className="h-screen flex items-center justify-center">
          <p className="text-white/60 text-lg">No clips found for &quot;{playerFilter}&quot;</p>
        </div>
      ) : (
        <YouTubeFeed
          key={playerFilter}
          clips={filteredClips}
          globalMute={globalMute}
        />
      )}
    </div>
  )
}

function Header({
  globalMute,
  toggleGlobalMute,
  trie,
  playerFilter,
  onPlayerFilter,
}: {
  globalMute: boolean
  toggleGlobalMute: () => void
  trie: Trie | null
  playerFilter: string
  onPlayerFilter: (player: string) => void
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-gradient-to-b from-black/70 to-transparent">
      <div className="flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">Volleyball Clips</h1>
        <div className="flex gap-2 items-center">
          <PlayerSearch trie={trie} playerFilter={playerFilter} onPlayerFilter={onPlayerFilter} />
          <button
            onClick={toggleGlobalMute}
            className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded text-white text-sm"
          >
            {globalMute ? "🔇" : "🔊"}
          </button>
        </div>
      </div>
    </div>
  )
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="text-white text-xl">{message}</div>
    </div>
  )
}

function EmptyScreen() {
  return (
    <div className="h-screen flex items-center justify-center bg-black">
      <p className="text-white text-xl">No clips yet!</p>
    </div>
  )
}
