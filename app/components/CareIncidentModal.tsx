'use client'

import React, { useEffect, useRef } from 'react'
import { CareIncident, EscalationStatus } from '@/lib/types/care'
import { ChimeIcon, FamilyIcon, HelpIcon, CheckIcon, PhoneIcon, AlertIcon } from './icons'

interface CareIncidentModalProps {
  incident: CareIncident | null
  escalation: EscalationStatus
  onCancel: () => void
  onImmediateDispatch: () => void
}

const STEPS = [
  { level: 1, Icon: ChimeIcon, title: 'At home', body: 'A gentle chime and a voice check through the camera' },
  { level: 2, Icon: FamilyIcon, title: 'Family', body: 'Text and call to the caregiver, over cellular if needed' },
  { level: 3, Icon: HelpIcon, title: 'Emergency services', body: 'Dispatch with a clinical brief for paramedics' },
] as const

export function CareIncidentModal({ incident, escalation, onCancel, onImmediateDispatch }: CareIncidentModalProps) {
  const chimedFor = useRef<string | null>(null)

  // Soft two-note chime (falling fifth) once per incident
  useEffect(() => {
    if (!incident || !escalation.active || chimedFor.current === incident.id) return
    chimedFor.current = incident.id
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      ;[659.25, 440].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const t = ctx.currentTime + i * 0.35
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, t)
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 1)
      })
    } catch {
      // Audio may need a user gesture first
    }
  }, [incident, escalation.active])

  if (!incident || !escalation.active) return null

  const remaining = escalation.secondsRemaining
  const frac = Math.max(0, Math.min(1, remaining / escalation.totalSeconds))
  const dispatched = remaining <= 0
  const R = 34
  const C = 2 * Math.PI * R

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bark/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-parchment-paper shadow-2xl ring-1 ring-ember/40">
        {/* Header band */}
        <div className="bg-ember px-7 py-5 text-parchment-paper">
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] opacity-90">
            <AlertIcon className="w-4 h-4" />
            Something’s not right
          </div>
          <h2 className="mt-1.5 font-serif text-[28px] font-semibold leading-tight">{incident.title}</h2>
        </div>

        <div className="flex flex-col gap-5 p-7">
          <div className="flex items-center gap-6">
            {/* Countdown ring */}
            <div className="relative shrink-0">
              <svg width="96" height="96" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r={R} fill="none" stroke="#E9E0CC" strokeWidth="6" />
                <circle
                  cx="40"
                  cy="40"
                  r={R}
                  fill="none"
                  stroke="#A8432B"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  strokeDashoffset={C * (1 - frac)}
                  transform="rotate(-90 40 40)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-serif text-2xl font-semibold text-ember-deep leading-none">
                  {dispatched ? '0' : remaining}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-bark-mute mt-0.5">sec</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-[15px] leading-relaxed text-bark">{incident.description}</p>
              <p className="text-[13px] text-bark-mute">
                {dispatched
                  ? 'No answer came. Help has been sent.'
                  : 'If no one answers, Rooted reaches further out.'}{' '}
                Confidence {(incident.confidence * 100).toFixed(0)}% · {new Date(incident.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Reaching-out ladder */}
          <ol className="grid grid-cols-3 gap-2.5">
            {STEPS.map(({ level, Icon, title, body }) => {
              const reached = escalation.level >= level
              const current = escalation.level === level
              return (
                <li
                  key={level}
                  className={`rounded-2xl border p-3.5 transition ${
                    current
                      ? 'border-ember bg-ember-wash text-ember-deep'
                      : reached
                      ? 'border-ember/30 bg-ember-wash/50 text-ember-deep/80'
                      : 'border-bark-line bg-parchment text-bark-mute'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Step {level}</span>
                  </div>
                  <div className={`mt-1.5 text-sm font-semibold ${reached ? '' : 'text-bark-soft'}`}>{title}</div>
                  <div className="mt-0.5 text-[12px] leading-snug opacity-90">{body}</div>
                </li>
              )
            })}
          </ol>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              onClick={onCancel}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-moss py-4 text-base font-semibold text-parchment-paper transition hover:bg-moss-deep active:scale-[0.98]"
            >
              <CheckIcon className="w-5 h-5" />
              I’m okay
            </button>
            <button
              onClick={onImmediateDispatch}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-ember px-6 py-4 text-base font-semibold text-ember-deep transition hover:bg-ember-wash active:scale-[0.98]"
            >
              <PhoneIcon className="w-5 h-5" />
              Send help now
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
