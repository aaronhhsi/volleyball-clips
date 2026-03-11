'use client'

import { useEffect, useRef } from 'react'
import { Clip } from '@/lib/types'

// Minimal YT type declarations — avoids needing @types/youtube
declare global {
  interface Window {
    YT: {
      Player: new (
        el: string | HTMLElement,
        opts: {
          videoId?: string
          playerVars?: Record<string, string | number>
          events?: {
            onReady?: (e: { target: YTPlayer }) => void
            onStateChange?: (e: { data: number; target: YTPlayer }) => void
          }
        }
      ) => YTPlayer
      PlayerState: { ENDED: number; PLAYING: number; PAUSED: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  mute(): void
  unMute(): void
  destroy(): void
}

export default function YouTubeFeed({ clips, globalMute }: { clips: Clip[]; globalMute: boolean }) {
  const playersRef = useRef<(YTPlayer | null)[]>(clips.map(() => null))
  const containerRef = useRef<HTMLDivElement>(null)
  const mutedRef = useRef(globalMute)
  const readyCountRef = useRef(0)
  // Tracks which clip index is currently in the viewport.
  // Both onReady and IntersectionObserver write/read this so whichever
  // fires second can still trigger playback.
  const currentVisibleRef = useRef(0)

  // Keep mutedRef in sync so onReady callbacks read the right value
  mutedRef.current = globalMute

  // Load YT IFrame API and init players
  useEffect(() => {
    // Snapshot the callback that existed before this mount so we can
    // restore it on unmount — prevents stale closures from firing if
    // the component unmounts before the YT script finishes loading.
    const prevCallback = window.onYouTubeIframeAPIReady

    const initPlayers = () => {
      clips.forEach((clip, i) => {
        const el = document.getElementById(`yt-player-${i}`)
        if (!el) return

        const player = new window.YT.Player(el, {
          videoId: clip.youtube_id,
          playerVars: {
            playsinline: 1,
            rel: 0,
            controls: 0,
            enablejsapi: 1,
            // mute:1 satisfies browser muted-autoplay policy so playVideo() works
            mute: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: ({ target }) => {
              // Sync mute state (mute:1 playerVar above may differ from globalMute)
              if (mutedRef.current) target.mute()
              else target.unMute()
              readyCountRef.current++
              // If this clip is already in view (IntersectionObserver fired first),
              // play it now that the player is ready
              if (i === currentVisibleRef.current) {
                target.playVideo()
              }
            },
            onStateChange: ({ data, target }) => {
              if (data === window.YT.PlayerState.ENDED) {
                target.playVideo()
              }
            },
          },
        })
        playersRef.current[i] = player
      })
    }

    if (window.YT?.Player) {
      initPlayers()
    } else {
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.()
        initPlayers()
      }
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
    }

    return () => {
      // Restore the previous callback so a stale closure from this mount
      // doesn't fire if the script loads after this component unmounts
      window.onYouTubeIframeAPIReady = prevCallback
      playersRef.current.forEach(p => { try { p?.destroy() } catch { } })
      playersRef.current = clips.map(() => null)
      readyCountRef.current = 0
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // clips are stable on mount — parent uses key prop to remount on filter change

  // IntersectionObserver: play the clip in view, pause the rest
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute('data-index'))
          if (entry.isIntersecting) {
            // Always update the ref first — onReady may not have fired yet
            // for this player, and will read this ref when it does
            currentVisibleRef.current = idx
            playersRef.current.forEach((p, j) => {
              if (j !== idx) { try { p?.pauseVideo() } catch { } }
            })
            // If the player is already ready, play immediately;
            // otherwise onReady will handle it
            try { playersRef.current[idx]?.playVideo() } catch { }
          } else {
            try { playersRef.current[idx]?.pauseVideo() } catch { }
          }
        })
      },
      { threshold: 0.55 }
    )

    const wrappers = containerRef.current.querySelectorAll('.yt-wrapper')
    wrappers.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  // Sync global mute to all initialized players
  useEffect(() => {
    playersRef.current.forEach(p => {
      if (!p) return
      try {
        if (globalMute) p.mute()
        else p.unMute()
      } catch { }
    })
  }, [globalMute])

  return (
    <div
      ref={containerRef}
      className="h-screen overflow-y-scroll snap-y snap-mandatory"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
    >
      <style jsx global>{`
        .yt-player-inner > iframe {
          width: 100% !important;
          height: 100% !important;
          border: none;
        }
      `}</style>
      <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

      {clips.map((clip, i) => (
        <div
          key={clip.id}
          data-index={i}
          className="h-screen w-screen snap-start flex items-center justify-center yt-wrapper"
        >
          <div
            className="relative overflow-hidden yt-player-inner"
            style={{ height: '100vh', aspectRatio: '9/16' }}
          >
            <div id={`yt-player-${i}`} className="w-full h-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
