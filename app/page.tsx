'use client'

import { useEffect, useState, useRef } from 'react'
import { Clip } from '@/lib/types'
import { Trie } from '@/lib/trie'
import PlayerSearch from '@/components/PlayerSearch'
import YouTubeFeed from '@/components/YouTubeFeed'

type ViewMode = 'native' | 'youtube'

export default function Home() {
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [globalMute, setGlobalMute] = useState(true)
  const [playerFilter, setPlayerFilter] = useState<string>('')
  const [trie, setTrie] = useState<Trie | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('native')
  const containerRef = useRef<HTMLDivElement>(null)

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const userPaused = useRef<boolean[]>([])
  const loadedIndices = useRef<Set<number>>(new Set())

  useEffect(() => {
    fetchClips()
  }, [])

  const fetchClips = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/clips')
      let data: Clip[] = await response.json()

      const firstFilename = "DPbbK-0CTvm.mp4"
      data.sort((a, b) => {
        if (a.filename === firstFilename) return -1
        if (b.filename === firstFilename) return 1
        return 0
      })

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

  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (v) v.muted = globalMute
    })
  }, [globalMute])

  const isPreloadIndex = (i: number) => Math.abs(i - currentIndex) <= 1

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const indexAttr = entry.target.getAttribute('data-index')
          if (!indexAttr) return
          const index = Number(indexAttr)
          const videoEl = videoRefs.current[index]
          if (!videoEl) return

          if (entry.isIntersecting) {
            setCurrentIndex(index)

            // Pause all other videos immediately
            videoRefs.current.forEach((v, i) => {
              if (!v) return
              if (i !== index) v.pause()
            })

            // Autoplay logic
            if (!userPaused.current[index]) {
              if (videoEl.readyState >= 2) {
                // Video is already loaded → play immediately
                videoEl.play().catch(() => {})
              } else {
                // Video not loaded → wait for canplay
                const canPlayHandler = () => {
                  // Only play if still current and user hasn't paused
                  if (!userPaused.current[index] && index === currentIndex) {
                    videoEl.play().catch(() => {})
                  }
                  videoEl.removeEventListener('canplay', canPlayHandler)
                }
                videoEl.addEventListener('canplay', canPlayHandler)
              }
            }
          } else {
            videoEl.pause()
          }
        })
      },
      { threshold: 0.55 }
    )

    const wrappers = containerRef.current.querySelectorAll('.clip-wrapper')
    wrappers.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [clips, globalMute])

  useEffect(() => {
    if (!clips || clips.length === 0) return

    const indicesToEnsure = [currentIndex - 1, currentIndex, currentIndex + 1]
      .filter(i => i >= 0 && i < clips.length)

    indicesToEnsure.forEach(i => {
      const video = videoRefs.current[i]
      if (!video) return

      if (!loadedIndices.current.has(i) && video.readyState === 0) {
        try { video.load() } catch { }
        loadedIndices.current.add(i)
      }
    })
  }, [currentIndex, clips])

  const togglePlay = (i: number) => {
    const v = videoRefs.current[i]
    if (!v) return

    if (v.paused) {
      userPaused.current[i] = false
      v.play().catch(() => {})
    } else {
      userPaused.current[i] = true
      v.pause()
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
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {viewMode === 'youtube' ? (
        <YouTubeFeed globalMute={globalMute} />
      ) : (
        <div
          ref={containerRef}
          className="h-screen overflow-y-scroll snap-y snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

          {filteredClips.length === 0 && (
            <div className="h-screen flex items-center justify-center">
              <p className="text-white/60 text-lg">No clips found for &quot;{playerFilter}&quot;</p>
            </div>
          )}
          {filteredClips.map((clip, i) => (
            <div
              key={clip.id}
              data-index={i}
              className="h-screen w-screen snap-start flex items-center justify-center clip-wrapper relative"
              onClick={() => togglePlay(i)}
            >
              <video
                ref={(el) => { videoRefs.current[i] = el }}
                src={isPreloadIndex(i) ? `/api/proxy-video/${clip.filename}` : undefined}
                className="w-full max-w-md"
                style={{ height: 'min(90vh, 700px)', objectFit: 'contain' }}
                muted={globalMute}
                playsInline
                loop
                preload={isPreloadIndex(i) ? 'auto' : 'metadata'}
              />

              <ClipInfo clip={clip} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ClipInfo({ clip }: { clip: Clip }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
      <div className="max-w-md pointer-events-auto">
        {clip.player_names && clip.player_names.length > 0 && (
          <h2 className="text-white text-2xl font-bold mb-2">
            {clip.player_names.join(', ')}
          </h2>
        )}

        {clip.player_events && clip.player_events.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {clip.player_events.map((pe, i) => (
              <span
                key={i}
                className="inline-block bg-blue-500 text-white text-sm font-semibold px-3 py-1 rounded-full"
              >
                {pe.player ? `${pe.player}: ${pe.event?.toUpperCase()}` : pe.event?.toUpperCase()}
              </span>
            ))}
          </div>
        )}

        {clip.tournament && (
          <p className="text-white/90 mb-2">🏆 {clip.tournament}</p>
        )}
      </div>
    </div>
  )
}


function Header({
  globalMute,
  toggleGlobalMute,
  trie,
  playerFilter,
  onPlayerFilter,
  viewMode,
  setViewMode,
}: {
  globalMute: boolean
  toggleGlobalMute: () => void
  trie: Trie | null
  playerFilter: string
  onPlayerFilter: (player: string) => void
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-gradient-to-b from-black/70 to-transparent">
      <div className="flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">Volleyball Clips</h1>
        <div className="flex gap-2 items-center">
          <PlayerSearch trie={trie} playerFilter={playerFilter} onPlayerFilter={onPlayerFilter} />
          <div className="flex bg-white/10 rounded overflow-hidden text-white text-sm">
            <button
              onClick={() => setViewMode('native')}
              className={`px-3 py-2 transition-colors ${viewMode === 'native' ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              Native
            </button>
            <button
              onClick={() => setViewMode('youtube')}
              className={`px-3 py-2 transition-colors ${viewMode === 'youtube' ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              YT
            </button>
          </div>
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

function NavButton({ direction, onClick }: { direction: 'up' | 'down'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`fixed ${direction === 'up' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 z-40 bg-white/20 hover:bg-white/30 text-white p-4 rounded-full backdrop-blur-sm transition-all`}
      aria-label={direction === 'up' ? 'Previous clip' : 'Next clip'}
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={direction === 'up' ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
      </svg>
    </button>
  )
}
