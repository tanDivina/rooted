'use client'

import React from 'react'
import { PanTiltState } from '@/lib/types/care'
import { CompassIcon, ChevronIcon, RecenterIcon, ChairIcon, KettleIcon, PillIcon, DoorIcon } from './icons'

interface PanTiltControlProps {
  panTilt: PanTiltState
  onUpdate: (updated: Partial<PanTiltState>) => void
}

const PRESETS = [
  { name: 'Living Room Couch', label: 'Couch', Icon: ChairIcon, pan: 0, tilt: 15 },
  { name: 'Kitchen Stove', label: 'Stove', Icon: KettleIcon, pan: 75, tilt: -10 },
  { name: 'Medicine Cabinet', label: 'Medicine', Icon: PillIcon, pan: -85, tilt: 5 },
  { name: 'Front Entryway', label: 'Front door', Icon: DoorIcon, pan: 160, tilt: 0 },
] as const

/** Compact controller for the Ring Pan-Tilt Indoor Cam: room presets, nudges and auto-follow. */
export function PanTiltControl({ panTilt, onUpdate }: PanTiltControlProps) {
  const handlePan = (delta: number) => {
    let next = (panTilt.panAngle + delta) % 360
    if (next > 180) next -= 360
    if (next < -180) next += 360
    onUpdate({ panAngle: next, currentPreset: 'Custom' })
  }

  const handleTilt = (delta: number) => {
    const next = Math.max(-45, Math.min(90, panTilt.tiltAngle + delta))
    onUpdate({ tiltAngle: next, currentPreset: 'Custom' })
  }

  const selectPreset = (name: string, pan: number, tilt: number) => {
    onUpdate({ panAngle: pan, tiltAngle: tilt, currentPreset: name, isMoving: true })
    setTimeout(() => onUpdate({ isMoving: false }), 400)
  }

  const nudge =
    'flex h-8 w-8 items-center justify-center rounded-full border border-bark-line bg-parchment-paper text-bark-soft transition hover:bg-parchment-deep active:scale-90'

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-2xl border border-bark-line bg-parchment-paper/80 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-moss-wash text-moss ${panTilt.isMoving ? 'animate-breathe' : ''}`}>
          <CompassIcon className="w-[18px] h-[18px]" />
        </span>
        <div className="leading-tight">
          <div className="text-[13.5px] font-semibold">Look around</div>
          <div className="text-[11.5px] text-bark-mute">
            Pan-Tilt cam (simulated) · {panTilt.panAngle}° / {panTilt.tiltAngle}°
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map(({ name, label, Icon, pan, tilt }) => {
          const active = panTilt.currentPreset.startsWith(name.split(' ')[0]) && panTilt.currentPreset !== 'Custom'
          return (
            <button
              key={name}
              onClick={() => selectPreset(name, pan, tilt)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition active:scale-[0.97] ${
                active ? 'border-bark bg-bark text-parchment-paper' : 'border-bark-line bg-parchment-paper text-bark hover:bg-parchment-deep'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          )
        })}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button onClick={() => handlePan(-15)} title="Pan left" aria-label="Pan left" className={nudge}>
          <ChevronIcon dir="left" className="w-4 h-4" />
        </button>
        <button onClick={() => handleTilt(10)} title="Tilt up" aria-label="Tilt up" className={nudge}>
          <ChevronIcon dir="up" className="w-4 h-4" />
        </button>
        <button onClick={() => handleTilt(-10)} title="Tilt down" aria-label="Tilt down" className={nudge}>
          <ChevronIcon dir="down" className="w-4 h-4" />
        </button>
        <button onClick={() => handlePan(15)} title="Pan right" aria-label="Pan right" className={nudge}>
          <ChevronIcon dir="right" className="w-4 h-4" />
        </button>
        <button onClick={() => selectPreset('Center', 0, 0)} title="Recenter" aria-label="Recenter" className={nudge}>
          <RecenterIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onUpdate({ autoTracking: !panTilt.autoTracking })}
          role="switch"
          aria-checked={panTilt.autoTracking}
          className={`ml-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition ${
            panTilt.autoTracking ? 'bg-moss-wash text-moss-deep' : 'bg-parchment-deep text-bark-mute'
          }`}
        >
          Follow alerts: {panTilt.autoTracking ? 'on' : 'off'}
        </button>
      </div>
    </div>
  )
}
