'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Clip } from '@/lib/types'

export default function Home() {
  const [clips, setClips] = useState<Clip[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [globalMute, setGlobalMute] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use nullable refs because we won't always have an element at every index
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const userPaused = useRef<boolean[]>([])
  const loadedIndices = useRef<Set<number>>(new Set()) // prevent duplicate loads

  useEffect(() => {
    fetchClips()
  }, [])

  const fetchClips = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/clips')
      let data: Clip[] = await response.json()

      // Move the specific video to the first position
      const firstFilename = "DPbbK-0CTvm.mp4"
      data.sort((a, b) => {
        if (a.filename === firstFilename) return -1  // a goes first
        if (b.filename === firstFilename) return 1   // b goes first
        return 0                                     // keep original order otherwise
      })

      setClips(data)
    } catch (error) {
      console.error('Error fetching clips:', error)
    } finally {
      setLoading(false)
    }
  }

  // Keep mute synced
  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (v) v.muted = globalMute
    })
  }, [globalMute])

  // Helper: which indices should currently have src (current, prev, next)
  const isPreloadIndex = (i: number) => {
    return Math.abs(i - currentIndex) <= 1
  }

  // Auto-play on scroll using IntersectionObserver (keeps original logic)
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

            // If enough data available — play (respecting user pause)
            if (videoEl.readyState >= 2) {
              if (!userPaused.current[index]) {
                videoEl.muted = globalMute
                videoEl.play().catch(() => {})
              }
            } else {
              const canPlayHandler = () => {
                if (!userPaused.current[index]) {
                  videoEl.muted = globalMute
                  videoEl.play().catch(() => {})
                }
                videoEl.removeEventListener('canplay', canPlayHandler)
              }
              videoEl.addEventListener('canplay', canPlayHandler)
            }

            // We still call preloadAdjacent (keeps backward-compatibility)
            // actual load is handled by the useEffect below when currentIndex changes
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

  // When currentIndex or clips change, ensure adjacent videos have src and are loaded once.
  useEffect(() => {
    if (!clips || clips.length === 0) return

    const indicesToEnsure = [currentIndex - 1, currentIndex, currentIndex + 1]
      .filter(i => i >= 0 && i < clips.length)

    indicesToEnsure.forEach(i => {
      const video = videoRefs.current[i]
      if (!video) return

      // If this index hasn't been loaded yet and the video element is ready, call load()
      if (!loadedIndices.current.has(i)) {
        // If src is set by React (see render), .load() will fetch; only do it if readyState === 0
        if (video.readyState === 0) {
          try {
            video.load()
          } catch (e) {
            // ignore
          }
        }
        loadedIndices.current.add(i)
      }
    })
    // Note: we deliberately do not remove loadedIndices when leaving viewport;
    // keeping loadedIndices prevents duplicate network requests.
  }, [currentIndex, clips])

  // PreloadAdjacent kept for compatibility; it only sets preload attr now.
  const preloadAdjacent = (index: number) => {
    const indicesToPreload = [index - 1, index, index + 1].filter(i => i >= 0 && i < clips.length);

    videoRefs.current.forEach((video, i) => {
      if (!video) return;

      if (indicesToPreload.includes(i)) {
        video.preload = 'auto';
      } else {
        video.preload = 'metadata';
      }
    });
  };

  // User click to toggle play/pause
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

  // Manual scroll controls
  const scrollToClip = (index: number) => {
    const container = containerRef.current
    if (!container) return
    container.scrollTo({ top: index * window.innerHeight, behavior: 'smooth' })
  }

  const goToPrevious = () => currentIndex > 0 && scrollToClip(currentIndex - 1)
  const goToNext = () => currentIndex < clips.length - 1 && scrollToClip(currentIndex + 1)

  if (loading) return <LoadingScreen message="Loading clips..." />
  if (clips.length === 0) return <EmptyScreen />

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <Header
        globalMute={globalMute}
        toggleGlobalMute={() => setGlobalMute(!globalMute)}
      />

      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

        {clips.map((clip, i) => (
          <div
            key={clip.id}
            data-index={i}
            className="h-screen w-screen snap-start flex items-center justify-center clip-wrapper relative"
            onClick={() => togglePlay(i)}
          >
            {/* Only provide src for current / prev / next to avoid browser fetching everything */}
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

      {currentIndex > 0 && <NavButton direction="up" onClick={goToPrevious} />}
      {currentIndex < clips.length - 1 && <NavButton direction="down" onClick={goToNext} />}
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


function Header({ globalMute, toggleGlobalMute }: { globalMute: boolean, toggleGlobalMute: () => void }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 bg-gradient-to-b from-black/70 to-transparent">
      <div className="flex justify-between items-center">
        <h1 className="text-white text-2xl font-bold">🏐 Volleyball Clips</h1>
        <div className="flex gap-3 items-center">
          <button
            onClick={toggleGlobalMute}
            className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded text-white text-sm"
          >
            {globalMute ? "🔇" : "🔊"}
          </button>
          <Link
            href="/add"
            className="bg-blue-600 text-white px-4 py-2 rounded-full font-medium hover:bg-blue-700 transition text-sm"
          >
            + Add Clip
          </Link>
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
      <div className="text-center">
        <p className="text-white text-xl mb-4">No clips yet!</p>
        <Link
          href="/add"
          className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition inline-block"
        >
          Add Your First Clip
        </Link>
      </div>
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
