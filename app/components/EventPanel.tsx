'use client'

import { useState, useMemo, useCallback } from 'react'
import { EventCard, DetectionEvent } from './EventCard'

export type FilterType = 'all' | 'person_detected' | 'motion_detected'

interface EventPanelProps {
  events: DetectionEvent[]
  webhookUrl: string
}

// Limit displayed events to prevent DOM bloat
const MAX_DISPLAYED_EVENTS = 100

export function EventPanel({ events, webhookUrl }: EventPanelProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const base = filter === 'all' ? events : events.filter(e => e.event_type === filter)
    return base.slice(0, MAX_DISPLAYED_EVENTS)
  }, [events, filter])

  const totalCount = useMemo(() => 
    filter === 'all' ? events.length : events.filter(e => e.event_type === filter).length,
    [events, filter]
  )

  const handleToggle = useCallback((eventId: string) => {
    setExpandedEvent(prev => prev === eventId ? null : eventId)
  }, [])

  return (
    <>
      <div className="px-5 pt-1 pb-3">
        <h2 className="font-serif text-xl font-semibold">Signals</h2>
        <p className="text-[13px] text-bark-mute">Raw Ring webhook events as they arrive.</p>
      </div>
      {/* Filters */}
      <div className="px-5 pb-3 flex items-center gap-2">
        {(['all', 'person_detected', 'motion_detected'] as FilterType[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[12.5px] px-3 py-1 rounded-full ${filter === f ? 'bg-moss text-parchment-paper font-medium' : 'bg-parchment-deep text-bark-soft hover:bg-bark-line'}`}
          >
            {f === 'all' ? 'All' : f === 'person_detected' ? 'Person' : 'Motion'}
          </button>
        ))}
        <span className="ml-auto text-xs text-bark-mute">
          {filtered.length === totalCount ? totalCount : `${filtered.length}/${totalCount}`} events
        </span>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-2">
        {filtered.length === 0 ? (
          <p className="text-center text-bark-mute mt-8 text-sm">
            Listening for Ring events…<br />
            <span className="text-xs font-mono">POST to {webhookUrl}</span>
          </p>
        ) : (
          filtered.map((event) => (
            <EventCard
              key={event.event_id}
              event={event}
              expanded={expandedEvent === event.event_id}
              onToggle={() => handleToggle(event.event_id)}
            />
          ))
        )}
      </div>
    </>
  )
}
