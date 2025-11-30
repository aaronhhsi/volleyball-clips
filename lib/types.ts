export interface Clip {
  id: string
  instagram_url: string
  player_names?: string[]
  tournament?: string
  player_events?: {
    player: string | null
    event: string | null
  }[]
  filename: string
  video_url?: string
  created_at: string
  updated_at: string
}

export interface ClipFormData {
  instagram_url: string
  tournament: string
  player_events: {
    player: string | null
    event: string | null
  }[]
}

// Removed 'ace'
export type EventType = 'serve' | 'kill' | 'dig' | 'block' | 'set' | 'other'
