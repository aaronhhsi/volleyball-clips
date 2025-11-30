'use client'

import { Clip } from '@/lib/types'
import { useState, useEffect, useRef } from 'react'

interface ClipCardProps {
  clip: Clip
}

export default function ClipCard({ clip }: ClipCardProps) {
  const [showEmbed, setShowEmbed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // IntersectionObserver to auto-play/pause
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            videoEl.play().catch(() => {}) // autoplay may fail if browser blocks
          } else {
            videoEl.pause()
          }
        })
      },
      { threshold: 0.6 } // 60% visible triggers play
    )

    observer.observe(videoEl)

    return () => {
      observer.disconnect()
    }
  }, [])

  // Extract reel ID from Instagram URL
  const getReelId = (url: string) => {
    const match = url.match(/reel\/([^/?]+)/)
    return match ? match[1] : null
  }

  const reelId = getReelId(clip.instagram_url)

  return (
    <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
      <div className="relative bg-black" style={{ paddingBottom: '125%' }}>
        {clip.video_url ? (
          <video
            ref={videoRef}
            src={clip.video_url}
            className="absolute inset-0 w-full h-full"
            loop
            muted
            playsInline
            preload="metadata"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div 
            className="absolute inset-0 flex items-center justify-center cursor-pointer bg-gradient-to-br from-purple-500 to-pink-500"
            onClick={() => setShowEmbed(true)}
          >
            <div className="text-center text-white">
              <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
              <p className="font-medium">Video not available yet</p>
            </div>
          </div>
        )}
      </div>

    <div className="p-4">
      {clip.player_names && clip.player_names.length > 0 && (
        <h3 className="font-bold text-lg mb-1">
          {clip.player_names.join(', ')}
        </h3>
      )}

      {clip.player_events && clip.player_events.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {clip.player_events.map((pe, i) => (
            <span
              key={i}
              className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded"
            >
              {pe.player ? `${pe.player}: ${pe.event?.toUpperCase()}` : pe.event?.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {clip.tournament && (
        <p className="text-sm text-gray-300 mb-2">🏆 {clip.tournament}</p>
      )}

      <a
        href={clip.instagram_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-500 hover:text-blue-700 font-medium"
      >
        View on Instagram →
      </a>
    </div>

    </div>
  )
}
