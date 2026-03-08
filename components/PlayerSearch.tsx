'use client'

import { useState, useRef, useEffect } from 'react'
import { Trie } from '@/lib/trie'

interface PlayerSearchProps {
  trie: Trie | null
  playerFilter: string
  onPlayerFilter: (player: string) => void
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function PlayerSearch({ trie, playerFilter, onPlayerFilter }: PlayerSearchProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasFilter = !!playerFilter

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus input when menu opens
  useEffect(() => {
    if (menuOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setInput('')
      setSuggestions([])
    }
  }, [menuOpen])

  const handleInput = (text: string) => {
    setInput(text)
    if (!trie || !text.trim()) {
      setSuggestions([])
      return
    }
    const results = trie.search(text.trim())
    setSuggestions(results.map(r => r.replace(/\b\w/g, c => c.toUpperCase())))
  }

  const selectSuggestion = (suggestion: string) => {
    onPlayerFilter(suggestion)
    setMenuOpen(false)
  }

  const clearPlayer = () => {
    onPlayerFilter('')
    setInput('')
    setSuggestions([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && suggestions.length > 0) {
      selectSuggestion(suggestions[0])
    } else if (e.key === 'Escape') {
      setMenuOpen(false)
    }
  }

  return (
    <div ref={menuRef} className="relative">
      {/* Search button */}
      <button
        onClick={() => setMenuOpen(prev => !prev)}
        className={`relative bg-white/10 hover:bg-white/20 px-3 py-2 rounded text-white text-sm transition-colors ${menuOpen ? 'bg-white/20' : ''}`}
        aria-label="Search"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        {hasFilter && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full" />
        )}
      </button>

      {/* Dropdown menu */}
      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-black/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Active filter chip */}
          {hasFilter && (
            <div className="px-4 pt-3 pb-0 flex flex-wrap gap-2">
              <span className="flex items-center gap-1.5 bg-blue-600/80 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                {playerFilter}
                <button onClick={clearPlayer} className="hover:text-white/70">
                  <XIcon />
                </button>
              </span>
            </div>
          )}

          {/* Player section */}
          <div className="p-4">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Player</p>
            <div className="flex items-center bg-white/10 rounded-lg px-3 py-2 gap-2">
              <svg className="w-3.5 h-3.5 text-white/40 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => handleInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search players..."
                className="bg-transparent text-white text-sm placeholder-white/30 outline-none w-full"
              />
              {input && (
                <button onClick={() => { setInput(''); setSuggestions([]) }} className="text-white/40 hover:text-white">
                  <XIcon />
                </button>
              )}
            </div>

            {suggestions.length > 0 && (
              <ul className="mt-1 border border-white/10 rounded-lg overflow-hidden">
                {suggestions.map((s, i) => (
                  <li key={i}>
                    <button
                      onMouseDown={e => { e.preventDefault(); selectSuggestion(s) }}
                      className="w-full text-left px-3 py-2 text-white text-sm hover:bg-white/10 transition-colors"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-white/10" />

          {/* Team section (coming soon) */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-white/30 text-xs font-semibold uppercase tracking-wider">Team</p>
              <span className="text-white/30 text-xs bg-white/10 px-2 py-0.5 rounded-full">coming soon</span>
            </div>
            <div className="flex items-center bg-white/5 rounded-lg px-3 py-2 gap-2 cursor-not-allowed">
              <svg className="w-3.5 h-3.5 text-white/20 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
              <input
                type="text"
                disabled
                placeholder="Search teams..."
                className="bg-transparent text-white/20 text-sm placeholder-white/20 outline-none w-full cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
