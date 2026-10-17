'use client'

import React, { useEffect, useState } from 'react'
import { CareIncident } from '@/lib/types/care'
import { FallIcon, KettleIcon, VoiceIcon, SignalOffIcon, SproutIcon, CheckIcon, PageIcon, CloseIcon, SmokeIcon, PillIcon, DoorIcon } from './icons'

interface CaregiverTimelineProps {
  incidents: CareIncident[]
  onAcknowledge: (id: string) => void
}

const KIND: Record<string, { Icon: (p: React.SVGProps<SVGSVGElement>) => JSX.Element; tone: string }> = {
  fall_detected: { Icon: FallIcon, tone: 'text-ember bg-ember-wash' },
  slip_inactivity: { Icon: FallIcon, tone: 'text-ember bg-ember-wash' },
  stove_unattended: { Icon: KettleIcon, tone: 'text-honey bg-honey-wash' },
  voice_distress: { Icon: VoiceIcon, tone: 'text-ember bg-ember-wash' },
  heartbeat_loss: { Icon: SignalOffIcon, tone: 'text-honey bg-honey-wash' },
  smoke_co_alarm: { Icon: SmokeIcon, tone: 'text-ember bg-ember-wash' },
  medication_missed: { Icon: PillIcon, tone: 'text-honey bg-honey-wash' },
  night_wandering: { Icon: DoorIcon, tone: 'text-honey bg-honey-wash' },
}
const CALM = { Icon: SproutIcon, tone: 'text-moss bg-moss-wash' }

/** The caregiver log, drawn as growth rings: newest on top, each moment a ring on the trunk. */
export function CaregiverTimeline({ incidents, onAcknowledge }: CaregiverTimelineProps) {
  const [briefFor, setBriefFor] = useState<CareIncident | null>(null)
  const [brief, setBrief] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // The page is prerendered at build time, so clock times are only written once in the browser
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const openBrief = async (incident: CareIncident) => {
    setBriefFor(incident)
    setLoading(true)
    setBrief(null)
    try {
      const res = await fetch('/api/care/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident }),
      })
      const data = await res.json()
      setBrief(data.summary || 'Summary unavailable')
    } catch {
      setBrief(
        `EMERGENCY EMS REPORT\nEvent: ${incident.title}\nSeverity: ${incident.severity.toUpperCase()}\nTime: ${new Date(incident.timestamp).toLocaleString()}\nDetails: ${incident.description}\nConfidence: ${Math.round(incident.confidence * 100)}%`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-5">
      <div className="pt-1 pb-4">
        <h2 className="font-serif text-xl font-semibold">Growth rings</h2>
        <p className="text-[13px] text-bark-mute">Every moment Rooted noticed, newest first.</p>
      </div>

      <ol className="relative">
        {/* trunk line */}
        <span className="absolute left-[19px] top-2 bottom-2 w-px bg-bark-line" aria-hidden="true" />

        {incidents.map((incident) => {
          const { Icon, tone } = KIND[incident.type] || CALM
          const urgent = incident.severity === 'critical' || incident.severity === 'high'
          return (
            <li key={incident.id} className="relative flex gap-4 pb-4">
              <span className={`relative z-10 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-parchment ${tone}`}>
                <Icon className="w-[18px] h-[18px]" />
              </span>

              <div className={`flex-1 rounded-2xl border bg-parchment-paper p-4 shadow-leaf ${urgent && !incident.resolved ? 'border-ember/40' : 'border-bark-line'}`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-[15px] font-semibold leading-snug">{incident.title}</h3>
                  {incident.resolved ? (
                    incident.escalationLevel === 3 ? (
                      <span className="shrink-0 rounded-full bg-ember-wash px-2 py-0.5 text-[11px] font-semibold text-ember-deep">
                        Help sent
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 text-[12px] font-medium text-moss">
                        <CheckIcon className="w-3.5 h-3.5" />
                        Settled
                      </span>
                    )
                  ) : (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${urgent ? 'bg-ember text-parchment-paper' : 'bg-parchment-deep text-bark-soft'}`}>
                      {incident.severity}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-[12px] text-bark-mute">
                  {mounted && new Date(incident.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ·{' '}
                  {(incident.confidence * 100).toFixed(0)}% sure
                </div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-bark-soft">{incident.description}</p>

                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => openBrief(incident)} className="btn-ghost !px-3 !py-1.5 !text-[12.5px]">
                    <PageIcon className="w-3.5 h-3.5" />
                    Paramedic brief
                  </button>
                  {!incident.resolved && (
                    <button onClick={() => onAcknowledge(incident.id)} className="btn-moss !px-3 !py-1.5 !text-[12.5px]">
                      <CheckIcon className="w-3.5 h-3.5" />
                      Mark settled
                    </button>
                  )}
                </div>
              </div>
            </li>
          )
        })}

        {incidents.length === 0 && (
          <li className="py-12 text-center text-sm text-bark-mute">
            <SproutIcon className="mx-auto mb-2 h-8 w-8 text-moss-soft" />
            A quiet day. Nothing to report.
          </li>
        )}
      </ol>

      {briefFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bark/40 backdrop-blur-sm p-4">
          <div className="card w-full max-w-xl p-7 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="eyebrow">For first responders</div>
                <h2 className="font-serif text-2xl font-semibold mt-1">Paramedic brief</h2>
              </div>
              <button onClick={() => setBriefFor(null)} className="text-bark-mute hover:text-bark" aria-label="Close">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-3 py-10 text-sm text-bark-mute">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-moss border-t-transparent" />
                Writing the brief…
              </div>
            ) : (
              <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-xl border border-bark-line bg-parchment p-4 font-mono text-[12px] leading-relaxed text-bark">
                {brief}
              </pre>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[12px] text-bark-mute">Ready to send to dispatch by webhook</span>
              <button onClick={() => setBriefFor(null)} className="btn-ghost">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
