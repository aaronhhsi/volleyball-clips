export interface Clip {
  id: string
  instagram_url: string
  player_name?: string
  tournament?: string
  event_type?: string
  filename: string // required
  video_url?: string
  created_at: string
  updated_at: string
}


export interface ClipFormData {
  instagram_url: string
  player_name: string
  tournament: string
  event_type: string
  tags: string[]
  notes: string
}

export type EventType = 'serve' | 'kill' | 'dig' | 'block' | 'ace' | 'set' | 'other'