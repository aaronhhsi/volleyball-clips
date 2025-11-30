import { Clip } from '@/lib/types'
import ClipCard from './ClipCard'

interface ClipGridProps {
  clips: Clip[]
}

export default function ClipGrid({ clips }: ClipGridProps) {
  if (clips.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No clips found. Try adjusting your filters or add a new clip!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {clips.map((clip) => (
        <ClipCard key={clip.id} clip={clip} />
      ))}
    </div>
  )
}