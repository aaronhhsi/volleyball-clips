'use client'

import { useState } from 'react'

const EVENT_TYPES = ['serve', 'kill', 'dig', 'block', 'ace', 'set', 'other']

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void
}

export interface SearchFilters {
  query: string
  eventType: string
  player: string
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    eventType: '',
    player: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(filters)
  }

  const handleReset = () => {
    const resetFilters = {
      query: '',
      eventType: '',
      player: ''
    }
    setFilters(resetFilters)
    onSearch(resetFilters)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* General Search */}
        <div>
          <label htmlFor="query" className="block text-sm font-medium mb-2">
            Search
          </label>
          <input
            type="text"
            id="query"
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            placeholder="Search all fields..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Player Filter */}
        <div>
          <label htmlFor="player" className="block text-sm font-medium mb-2">
            Player Name
          </label>
          <input
            type="text"
            id="player"
            value={filters.player}
            onChange={(e) => setFilters({ ...filters, player: e.target.value })}
            placeholder="Filter by player..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Event Type Filter */}
        <div>
          <label htmlFor="eventType" className="block text-sm font-medium mb-2">
            Event Type
          </label>
          <select
            id="eventType"
            value={filters.eventType}
            onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Events</option>
            {EVENT_TYPES.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Search
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition"
        >
          Reset
        </button>
      </div>
    </form>
  )
}