'use client'

import { memo } from 'react'

export interface DetectionEvent {
  event_id: string
  event_type: string
  timestamp: string
  confidence: number | null
  bounding_box: { x: number; y: number; width: number; height: number } | null
  thumbnail_url: string | null
  metadata: Record<string, unknown>
  raw: unknown
}

interface EventCardProps {
  event: DetectionEvent
  expanded: boolean
  onToggle: () => void
}

/** Single event card - memoized to prevent unnecessary re-renders */
export const EventCard = memo(function EventCard({ event, expanded, onToggle }: EventCardProps) {
  return (
    <div className="card !p-3.5 cursor-pointer hover:border-moss-soft transition" onClick={onToggle}>
      <div className="flex items-center gap-3">
        <span className={`w-2 h-2 rounded-full shrink-0 ${event.event_type === 'person_detected' ? 'bg-moss' : 'bg-honey'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-bark">{event.event_type}</span>
            {event.confidence && (
              <span className="text-xs text-bark-mute">{(event.confidence * 100).toFixed(0)}%</span>
            )}
          </div>
          <p className="text-xs text-bark-mute">{new Date(event.timestamp).toLocaleTimeString()}</p>
        </div>
        {event.thumbnail_url && (
          <img src={event.thumbnail_url} alt="" className="w-10 h-10 rounded object-cover" />
        )}
      </div>
      {expanded && (
        <pre className="mt-3 p-2 bg-parchment rounded-lg text-xs text-bark overflow-x-auto max-h-48 font-mono">
          {JSON.stringify(event.raw, null, 2)}
        </pre>
      )}
    </div>
  )
})
