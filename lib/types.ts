export interface Clip {
  id: string
  youtube_id: string
  player_names?: string[]
  tournament?: string
  player_events?: {
    player: string | null
    event: string | null
    team: string | null
  }[]
  created_at: string
  updated_at: string
}

// Removed 'ace'
export type EventType = 'serve' | 'kill' | 'dig' | 'block' | 'set' | 'other'
