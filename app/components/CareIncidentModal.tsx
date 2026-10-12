'use client'

import React, { useEffect, useState } from 'react'
import { CareIncident, EscalationStatus } from '@/lib/types/care'
import { AlertTriangle, ShieldAlert, CheckCircle, PhoneCall, Volume2, Bell } from 'lucide-react'

interface CareIncidentModalProps {
  incident: CareIncident | null
  escalation: EscalationStatus
  onCancel: () => void
  onImmediateDispatch: () => void
}

export function CareIncidentModal({
  incident,
  escalation,
  onCancel,
  onImmediateDispatch,
}: CareIncidentModalProps) {
  const [soundPlayed, setSoundPlayed] = useState(false)

  useEffect(() => {
    if (incident && escalation.active && !soundPlayed) {
      // Play brief synthesized alarm chime via Web Audio API
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const osc = audioCtx.createOscillator()
        const gain = audioCtx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 note
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5)
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
        osc.connect(gain)
        gain.connect(audioCtx.destination)
        osc.start()
        osc.stop(audioCtx.currentTime + 0.5)
        setSoundPlayed(true)
      } catch {
        // Audio context may require initial user gesture
      }
    }
  }, [incident, escalation.active, soundPlayed])

  if (!incident || !escalation.active) return null

  const pct = Math.max(0, Math.min(100, (escalation.secondsRemaining / escalation.totalSeconds) * 100))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-red-500 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-red-500/20 text-white flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wider bg-red-500 text-white rounded">
                  Critical Alert
                </span>
                <span className="text-xs text-slate-400">Ring Guardian Sentinel</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">{incident.title}</h2>
            </div>
          </div>
        </div>

        {/* Incident Details */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 flex flex-col gap-2">
          <p className="text-sm text-slate-300 leading-relaxed">{incident.description}</p>
          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/40">
            <span>Detection Confidence: <strong className="text-red-400 font-mono">{(incident.confidence * 100).toFixed(0)}%</strong></span>
            <span>Triggered: <strong className="text-slate-300 font-mono">{new Date(incident.timestamp).toLocaleTimeString()}</strong></span>
          </div>
        </div>

        {/* Dead-Man's Escalation Countdown */}
        <div className="bg-gradient-to-r from-red-950/40 to-slate-900 rounded-xl p-4 border border-red-900/60 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-xs font-semibold uppercase text-red-300 tracking-wide">
                Fail-Safe Dead-Man Countdown
              </span>
            </div>
            <span className="text-2xl font-black font-mono text-red-400">
              {escalation.secondsRemaining}s
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-red-500 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* Escalation Stage Matrix */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className={`p-2 rounded-lg border transition ${escalation.level === 1 ? 'bg-amber-950/40 border-amber-500 text-amber-200' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
              <Volume2 className="w-4 h-4 mx-auto mb-1 opacity-80" />
              <div className="font-semibold text-[11px]">Level 1</div>
              <div className="text-[10px]">In-Home Chime</div>
            </div>
            <div className={`p-2 rounded-lg border transition ${escalation.level === 2 ? 'bg-orange-950/40 border-orange-500 text-orange-200' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
              <Bell className="w-4 h-4 mx-auto mb-1 opacity-80" />
              <div className="font-semibold text-[11px]">Level 2</div>
              <div className="text-[10px]">Caregiver SMS</div>
            </div>
            <div className={`p-2 rounded-lg border transition ${escalation.level === 3 ? 'bg-red-950/60 border-red-500 text-red-200 animate-pulse' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
              <PhoneCall className="w-4 h-4 mx-auto mb-1 opacity-80" />
              <div className="font-semibold text-[11px]">Level 3</div>
              <div className="text-[10px]">911 Dispatch</div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 transition active:scale-95"
          >
            <CheckCircle className="w-5 h-5" />
            I'M OKAY — CANCEL ALARM
          </button>
          <button
            onClick={onImmediateDispatch}
            className="py-3 px-4 rounded-xl bg-red-600/80 hover:bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-2 border border-red-500 transition active:scale-95"
          >
            <PhoneCall className="w-4 h-4" />
            DISPATCH NOW
          </button>
        </div>
      </div>
    </div>
  )
}
