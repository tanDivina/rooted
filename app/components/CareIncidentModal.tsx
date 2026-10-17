'use client'

import React, { useEffect, useRef, useState } from 'react'
import { CareIncident, EscalationStatus } from '@/lib/types/care'
import { ChimeIcon, FamilyIcon, HelpIcon, CheckIcon, PhoneIcon, AlertIcon, CloseIcon, ShieldIcon } from './icons'

interface CareIncidentModalProps {
  incident: CareIncident | null
  escalation: EscalationStatus
  onCancel: () => void
  onImmediateDispatch: () => void
  // Shown briefly when the person answered for themselves and the alert stood down on its own
  resolution?: { title: string; body: string } | null
}

const STEPS = [
  { level: 1, Icon: ChimeIcon, title: 'At home', body: 'A gentle chime in the home, and a moment to answer' },
  { level: 2, Icon: FamilyIcon, title: 'Family', body: 'Email and text to the caregiver, over cellular if needed' },
  { level: 3, Icon: HelpIcon, title: 'Emergency services', body: 'Dispatch with a clinical brief for paramedics' },
] as const

const HOLD_DURATION_MS = 2500 // 2.5 seconds deliberate hold required to cancel

export function CareIncidentModal({ incident, escalation, onCancel, onImmediateDispatch, resolution }: CareIncidentModalProps) {
  const chimedFor = useRef<string | null>(null)

  // Sub-state inside modal: 'incident' | 'grace_dispatch' | 'cancelled_reassurance'
  const [modalMode, setModalMode] = useState<'incident' | 'grace_dispatch' | 'cancelled_reassurance'>('incident')
  const [graceRemaining, setGraceRemaining] = useState<number>(15)

  // Hold-to-confirm state for "I'm okay"
  const [holdProgress, setHoldProgress] = useState<number>(0)
  const [isHolding, setIsHolding] = useState<boolean>(false)
  const [holdFeedback, setHoldFeedback] = useState<string | null>(null)
  const holdStartTimeRef = useRef<number | null>(null)
  const holdRafRef = useRef<number | null>(null)

  // Reset modal state when new incident arrives or modal opens
  useEffect(() => {
    if (incident) {
      setModalMode('incident')
      setGraceRemaining(15)
      setHoldProgress(0)
      setIsHolding(false)
      setHoldFeedback(null)
    }
  }, [incident?.id])

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
      // Audio may need user gesture
    }
  }, [incident, escalation.active])

  // Play pleasant ascending resolution chime when safely cancelled
  const playResolvedChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      ;[440, 659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const t = ctx.currentTime + i * 0.15
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, t)
        gain.gain.setValueAtTime(0.0001, t)
        gain.gain.exponentialRampToValueAtTime(0.15, t + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
        osc.connect(gain).connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.7)
      })
    } catch {
      // Ignore audio errors
    }
  }

  // Handle Press & Hold for "I'm okay"
  const startHold = (e: React.PointerEvent) => {
    e.preventDefault()
    setIsHolding(true)
    setHoldFeedback(null)
    holdStartTimeRef.current = Date.now()

    const step = () => {
      if (!holdStartTimeRef.current) return
      const elapsed = Date.now() - holdStartTimeRef.current
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100)
      setHoldProgress(pct)

      if (pct >= 100) {
        // Successfully confirmed
        setIsHolding(false)
        holdStartTimeRef.current = null
        playResolvedChime()
        setModalMode('cancelled_reassurance')
        setTimeout(() => {
          onCancel()
        }, 2200)
      } else {
        holdRafRef.current = requestAnimationFrame(step)
      }
    }

    holdRafRef.current = requestAnimationFrame(step)
  }

  const cancelHold = () => {
    if (isHolding && holdProgress < 100) {
      setHoldFeedback('Hold down for 2.5s to confirm')
      setTimeout(() => setHoldFeedback(null), 2500)
    }
    setIsHolding(false)
    setHoldProgress(0)
    holdStartTimeRef.current = null
    if (holdRafRef.current) {
      cancelAnimationFrame(holdRafRef.current)
      holdRafRef.current = null
    }
  }

  // Grace countdown timer when "Send help now" is tapped
  useEffect(() => {
    if (modalMode !== 'grace_dispatch') return

    const timer = setInterval(() => {
      setGraceRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onImmediateDispatch()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [modalMode, onImmediateDispatch])

  // Clicked "Send help now" -> enter 15s grace buffer instead of blind panic dispatch
  const handleInitiateHelp = () => {
    setModalMode('grace_dispatch')
    setGraceRemaining(15)
  }

  // Abort accidental false alarm during grace window
  const handleAbortFalseAlarm = () => {
    playResolvedChime()
    setModalMode('cancelled_reassurance')
    setTimeout(() => {
      onCancel()
    }, 2400)
  }

  // Answered for themselves: a calm confirmation, then the view goes back to normal
  if (resolution && !(incident && escalation.active)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bark/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-parchment-paper shadow-2xl ring-1 ring-moss/30 p-8 text-center flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-wash text-moss ring-4 ring-moss/20">
            <CheckIcon className="h-8 w-8" />
          </div>
          <h2 className="font-serif text-[26px] font-semibold text-bark">{resolution.title}</h2>
          <p className="text-[15px] leading-relaxed text-bark-soft max-w-md">{resolution.body}</p>
        </div>
      </div>
    )
  }

  if (!incident || !escalation.active) return null

  const paused = !!escalation.paused
  const remaining = paused ? escalation.resumeIn ?? 0 : escalation.secondsRemaining
  const frac = Math.max(0, Math.min(1, paused ? remaining / 120 : remaining / escalation.totalSeconds))
  const dispatched = remaining <= 0
  const R = 34
  const C = 2 * Math.PI * R

  // -------------------------------------------------------------
  // VIEW 1: REASSURANCE / FALSE ALARM RESOLVED STATE
  // -------------------------------------------------------------
  if (modalMode === 'cancelled_reassurance') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bark/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-parchment-paper shadow-2xl ring-1 ring-moss/30 p-8 text-center flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-moss-wash text-moss ring-4 ring-moss/20">
            <CheckIcon className="h-8 w-8" />
          </div>
          <h2 className="font-serif text-[26px] font-semibold text-bark">All clear.</h2>
          <p className="text-[15px] leading-relaxed text-bark-soft max-w-md">
            The alert is stood down and noted in Growth rings.
          </p>
          <div className="w-full rounded-2xl bg-parchment p-4 text-left border border-bark-line/60 flex items-start gap-3">
            <ShieldIcon className="w-5 h-5 shrink-0 text-moss mt-0.5" />
            <div className="text-[13px] leading-relaxed text-bark-soft">
              <strong className="text-bark font-semibold">A quiet follow-up:</strong> for the next 60 seconds the camera looks for them up and moving. If it doesn’t see that, Rooted reaches out again.
            </div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // VIEW 2: 15-SECOND EMERGENCY GRACE DISPATCH WINDOW
  // -------------------------------------------------------------
  if (modalMode === 'grace_dispatch') {
    const graceFrac = graceRemaining / 15
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bark/65 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-parchment-paper shadow-2xl ring-2 ring-ember">
          {/* Header band */}
          <div className="bg-ember px-7 py-5 text-parchment-paper">
            <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] opacity-90">
              <PhoneIcon className="w-4 h-4 animate-pulse" />
              Calling for help
            </div>
            <h2 className="mt-1 font-serif text-[26px] font-semibold leading-tight">Reaching your family and 911</h2>
          </div>

          <div className="flex flex-col gap-6 p-7">
            <div className="flex items-center gap-6">
              {/* Circular 15s Countdown */}
              <div className="relative shrink-0">
                <svg width="104" height="104" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r={R} fill="none" stroke="#F4D9D2" strokeWidth="6" />
                  <circle
                    cx="40"
                    cy="40"
                    r={R}
                    fill="none"
                    stroke="#A8432B"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - graceFrac)}
                    transform="rotate(-90 40 40)"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-serif text-3xl font-bold text-ember-deep leading-none">
                    {graceRemaining}
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-bark-mute mt-0.5">sec</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="text-[15px] font-medium text-bark leading-snug">
                  The family is being told now. The paramedic brief goes to 911 in {graceRemaining}s.
                </div>
                <p className="text-[13px] text-bark-mute leading-relaxed">
                  Pressed it by accident? Stand it down below, no harm done.
                </p>
              </div>
            </div>

            {/* Accidental Press Cancel CTA */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAbortFalseAlarm}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-bark py-4 px-6 text-base font-bold text-parchment-paper shadow-lg transition hover:bg-bark/90 active:scale-[0.98]"
              >
                <CloseIcon className="w-5 h-5 text-ember-wash" />
                <span>Cancel, it was a mistake</span>
              </button>

              <button
                onClick={onImmediateDispatch}
                className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold text-ember-deep hover:bg-ember-wash/50 transition"
              >
                <PhoneIcon className="w-3.5 h-3.5" />
                Don’t wait, call 911 now
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // VIEW 3: STANDARD INCIDENT ALERT (WITH 2.5s HOLD-TO-CONFIRM)
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bark/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-parchment-paper shadow-2xl ring-1 ring-ember/40">
        {/* Header band */}
        <div className={`${paused ? 'bg-honey' : 'bg-ember'} px-7 py-5 text-parchment-paper transition-colors`}>
          <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] opacity-90">
            <AlertIcon className="w-4 h-4" />
            {paused ? 'They answered, still on the floor' : 'Something’s not right'}
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
                  stroke={paused ? '#B7791F' : '#A8432B'}
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
              <p className="text-[15px] leading-relaxed text-bark">
                {paused
                  ? `${escalation.acknowledgedBy}, but they’re still on the floor. Rooted is waiting to see them get up, and the family has a gentle note.`
                  : incident.description}
              </p>
              <p className="text-[13px] text-bark-mute">
                {paused
                  ? `Reaches out again in ${remaining}s if they stay down.`
                  : dispatched
                  ? 'No answer came. Help has been sent.'
                  : 'They can answer out loud with “I’m okay”, or just get up. Otherwise Rooted reaches further out.'}{' '}
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

          {/* Action Row: Asymmetric Friction Protection */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2.5 sm:flex-row">
              {/* "Hold to Confirm I'm Okay" button */}
              <div className="relative flex-1 select-none">
                <button
                  onPointerDown={startHold}
                  onPointerUp={cancelHold}
                  onPointerLeave={cancelHold}
                  onPointerCancel={cancelHold}
                  className="relative overflow-hidden w-full flex items-center justify-center gap-2.5 rounded-2xl bg-moss py-4 px-4 text-[15px] whitespace-nowrap font-semibold text-parchment-paper shadow-md transition active:scale-[0.99] touch-none"
                  style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                >
                  {/* Progress fill track */}
                  <div
                    className="absolute inset-y-0 left-0 bg-moss-deep/70 transition-all duration-75"
                    style={{ width: `${holdProgress}%` }}
                  />

                  <span className="relative z-10 flex items-center gap-2">
                    <CheckIcon className="w-5 h-5 shrink-0" />
                    {isHolding ? (
                      <span>Hold to confirm ({(Math.max(0, (HOLD_DURATION_MS * (100 - holdProgress)) / 100000)).toFixed(1)}s)…</span>
                    ) : (
                      <span>Hold 2.5s: I checked, they’re okay</span>
                    )}
                  </span>
                </button>

                {/* Micro-feedback helper */}
                {holdFeedback && (
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-ember">
                    {holdFeedback}
                  </div>
                )}
              </div>

              {/* Immediate 1-Tap "Send help now" button */}
              <button
                onClick={handleInitiateHelp}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-ember bg-parchment-paper px-6 py-4 text-base font-bold text-ember-deep transition hover:bg-ember-wash active:scale-[0.98] shadow-sm"
              >
                <PhoneIcon className="w-5 h-5 text-ember" />
                Send help now
              </button>
            </div>

            {/* Asymmetric Safety Ground-Truth Notice */}
            <div className="mt-2 flex items-center justify-between rounded-xl bg-parchment px-3.5 py-2 text-[11.5px] text-bark-soft border border-bark-line/50">
              <span className="flex items-center gap-1.5">
                <ShieldIcon className="w-4 h-4 shrink-0 text-moss" />
                <span>
                  <strong>For whoever checked on them:</strong> family on the phone, or a neighbour in the room. A single tap won’t cancel.
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

