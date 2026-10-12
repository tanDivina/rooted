'use client'

import React from 'react'
import { PanTiltState } from '@/lib/types/care'
import {
  Compass,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  Eye,
  Crosshair,
  Flame,
  Pill,
  DoorOpen,
  Armchair,
} from 'lucide-react'

interface PanTiltControlProps {
  panTilt: PanTiltState
  onUpdate: (updated: Partial<PanTiltState>) => void
}

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
    onUpdate({
      panAngle: pan,
      tiltAngle: tilt,
      currentPreset: name,
      isMoving: true,
    })
    setTimeout(() => onUpdate({ isMoving: false }), 400)
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col gap-3 text-xs text-white shadow-xl backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <span className="font-bold text-white text-[11px] block">
              Ring Pan-Tilt Indoor Cam
            </span>
            <span className="text-[10px] text-slate-400">
              360° Motorized Pan • 169° Vertical Tilt
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onUpdate({ autoTracking: !panTilt.autoTracking })}
            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
              panTilt.autoTracking
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {panTilt.autoTracking ? '🎯 Auto-Slew: ON' : 'Auto-Slew: OFF'}
          </button>
        </div>
      </div>

      {/* Preset Quick-Jumps */}
      <div>
        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>Camera Presets</span>
          <span className="text-cyan-400 font-mono">
            Pan {panTilt.panAngle}° • Tilt {panTilt.tiltAngle}°
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          <button
            onClick={() => selectPreset('Living Room Couch', 0, 15)}
            className={`p-2 rounded-xl border flex items-center gap-1.5 transition text-[11px] font-medium ${
              panTilt.currentPreset === 'Living Room Couch'
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300 font-bold'
                : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Armchair className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Couch / Seating</span>
          </button>

          <button
            onClick={() => selectPreset('Kitchen Stove', 75, -10)}
            className={`p-2 rounded-xl border flex items-center gap-1.5 transition text-[11px] font-medium ${
              panTilt.currentPreset === 'Kitchen Stove'
                ? 'bg-orange-950 border-orange-500 text-orange-300 font-bold'
                : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="truncate">Kitchen Stove</span>
          </button>

          <button
            onClick={() => selectPreset('Medicine Cabinet', -85, 5)}
            className={`p-2 rounded-xl border flex items-center gap-1.5 transition text-[11px] font-medium ${
              panTilt.currentPreset === 'Medicine Cabinet'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Pill className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Med Cabinet</span>
          </button>

          <button
            onClick={() => selectPreset('Front Entryway', 160, 0)}
            className={`p-2 rounded-xl border flex items-center gap-1.5 transition text-[11px] font-medium ${
              panTilt.currentPreset === 'Front Entryway'
                ? 'bg-indigo-950 border-indigo-500 text-indigo-300 font-bold'
                : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">Front Door</span>
          </button>
        </div>
      </div>

      {/* Directional D-Pad Controls */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active View: <strong className="text-white">{panTilt.currentPreset}</strong></span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => handlePan(-15)}
            title="Pan Left"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 active:scale-90 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleTilt(10)}
            title="Tilt Up"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 active:scale-90 transition"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleTilt(-10)}
            title="Tilt Down"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 active:scale-90 transition"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handlePan(15)}
            title="Pan Right"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 active:scale-90 transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => selectPreset('Center', 0, 0)}
            title="Recenter"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 active:scale-90 transition ml-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
