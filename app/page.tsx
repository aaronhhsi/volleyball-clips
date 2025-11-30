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
  const videoRefs = useRef<HTMLVideoElement[]>([])
  const userPaused = useRef<boolean[]>([])

  useEffect(() => {
    fetchClips()
  }, [])

  const fetchClips = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/clips')
      const data = await response.json()
      setClips(data)
    } catch (error) {
      console.error('Error fetching clips:', error)
    } finally {
      setLoading(false)
    }
  }

  // Global mute affects all videos immediately
  useEffect(() => {
    videoRefs.current.forEach((vid) => {
      if (vid) {
        vid.muted = globalMute
      }
    })
  }, [globalMute])

  // Auto-play on scroll using IntersectionObserver
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'))
          const videoEl = videoRefs.current[index]
          if (!videoEl) return

          if (entry.isIntersecting) {
            setCurrentIndex(index)

            // Ensure video is loaded before playing
            if (videoEl.readyState >= 2) {
              // HAVE_CURRENT_DATA or better
              if (!userPaused.current[index]) {
                videoEl.muted = globalMute
                videoEl.play().catch(() => {})
              }
            } else {
              // Wait for enough data to play
              const canPlayHandler = () => {
                if (!userPaused.current[index]) {
                  videoEl.muted = globalMute
                  videoEl.play().catch(() => {})
                }
                videoEl.removeEventListener('canplay', canPlayHandler)
              }
              videoEl.addEventListener('canplay', canPlayHandler)
            }

            // Preload adjacent videos
            preloadAdjacent(index)
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

  // Preload current, previous, and next videos only
  const preloadAdjacent = (index: number) => {
    const indicesToPreload = [
      index - 1, // previous
      index,     // current
      index + 1, // next
    ].filter(i => i >= 0 && i < clips.length)

    videoRefs.current.forEach((video, i) => {
      if (!video) return
      
      if (indicesToPreload.includes(i)) {
        // Preload nearby videos
        video.preload = 'auto'
        // Start loading if not already
        if (video.readyState === 0) {
          video.load()
        }
      } else {
        // Don't preload far videos
        video.preload = 'metadata'
      }
    })
  }

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
            <video
              ref={(el) => { videoRefs.current[i] = el! }}
              src={`/api/proxy-video/${clip.filename}`}
              className="w-full max-w-md"
              style={{ height: 'min(90vh, 700px)', objectFit: 'contain' }}
              muted={globalMute}
              playsInline
              loop
              preload={i === 0 ? 'auto' : 'metadata'}
            />

            <ClipInfo clip={clip} />
          </div>
        ))}
      </div>

      {currentIndex > 0 && <NavButton direction="up" onClick={goToPrevious} />}
      {currentIndex < clips.length - 1 && <NavButton direction="down" onClick={goToNext} />}
      <ScrollIndicator clips={clips} currentIndex={currentIndex} onScrollTo={scrollToClip} />
    </div>
  )
}

function ClipInfo({ clip }: { clip: Clip }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
      <div className="max-w-md pointer-events-auto">
        {clip.player_name && (
          <h2 className="text-white text-2xl font-bold mb-2">{clip.player_name}</h2>
        )}
        {clip.event_type && (
          <span className="inline-block bg-blue-500 text-white text-sm font-semibold px-3 py-1 rounded-full mb-2">
            {clip.event_type.toUpperCase()}
          </span>
        )}
        {clip.tournament && (
          <p className="text-white/90 mb-2">🏆 {clip.tournament}</p>
        )}
        <p className="text-xs text-white/60 mt-2">(tap to pause/play)</p>
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

function ScrollIndicator({ clips, currentIndex, onScrollTo }: { clips: Clip[], currentIndex: number, onScrollTo: (i: number) => void }) {
  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-2" style={{ marginRight: '4.5rem' }}>
      {clips.map((_, i) => (
        <button
          key={i}
          onClick={() => onScrollTo(i)}
          className={`w-2 h-2 rounded-full transition-all ${
            i === currentIndex ? 'bg-white h-8' : 'bg-white/50'
          }`}
        />
      ))}
    </div>
  )
}