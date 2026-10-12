'use client'

import React from 'react'
import { ContactSensor, MotionSensor, SmokeCOListener } from '@/lib/types/care'
import { PillIcon, FridgeIcon, DoorIcon, MotionIcon, SmokeIcon, CheckIcon } from './icons'

interface SensorGridProps {
  contactSensors: ContactSensor[]
  motionSensors: MotionSensor[]
  smokeCO: SmokeCOListener
  onSimulateContactOpen: (sensorId: string) => void
  onSimulateSmokeAlarm: () => void
}

const time = (ms: number) => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

function ago(ms: number) {
  const min = Math.round((Date.now() - ms) / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m ago`
  return `${Math.round(min / 60)}h ago`
}

/** Ring Alarm sensors as the household's daily rhythms: doors, rooms and the smoke alarm. */
export function SensorGrid({
  contactSensors,
  motionSensors,
  smokeCO,
  onSimulateContactOpen,
  onSimulateSmokeAlarm,
}: SensorGridProps) {
  const alarm = smokeCO.smokeAlarmDetected || smokeCO.coAlarmDetected

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-6">
      <div className="pt-1">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold">Daily rhythms</h2>
          <span className="flex items-center gap-1.5 text-[12px] text-moss-deep">
            <span className="h-1.5 w-1.5 rounded-full bg-moss animate-breathe" />
            {contactSensors.length + motionSensors.length + 1} Ring Alarm sensors
          </span>
        </div>
        <p className="text-[13px] text-bark-mute">
          Small signs of an ordinary day: medicine taken, the fridge opened, someone moving between rooms.
        </p>
      </div>

      {/* Contact sensors */}
      <section className="space-y-2.5">
        <div className="eyebrow">Doors &amp; cabinets</div>
        {contactSensors.map((sensor) => {
          const open = sensor.state === 'open'
          const Icon =
            sensor.type === 'medicine_cabinet' ? PillIcon : sensor.type === 'refrigerator' ? FridgeIcon : DoorIcon
          return (
            <div key={sensor.id} className="card !p-4">
              <div className="flex items-start gap-3">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${open ? 'bg-honey-wash text-honey' : 'bg-moss-wash text-moss'}`}>
                  <Icon className="w-[18px] h-[18px]" {...(sensor.type === 'front_door' ? { open } : {})} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[14.5px] font-semibold">{sensor.name}</h3>
                    {sensor.complianceStatus === 'compliant' && !open && (
                      <span className="flex items-center gap-1 text-[12px] font-medium text-moss">
                        <CheckIcon className="w-3.5 h-3.5" />
                        On track
                      </span>
                    )}
                    {open && <span className="rounded-full bg-honey-wash px-2 py-0.5 text-[11px] font-semibold text-[#7a4f12]">Open</span>}
                  </div>
                  <p className="mt-0.5 text-[13px] text-bark-soft">{sensor.notes || 'Watching the routine'}</p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="text-[12px] text-bark-mute">Last changed {time(sensor.lastChanged)}</span>
                    <button onClick={() => onSimulateContactOpen(sensor.id)} className="btn-ghost !px-3 !py-1 !text-[12px]">
                      Try: {open ? 'close' : 'open'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* Motion */}
      <section className="space-y-2.5">
        <div className="eyebrow">Who’s moving where</div>
        <div className="grid grid-cols-2 gap-2">
          {motionSensors.map((sensor) => (
            <div
              key={sensor.id}
              className={`rounded-2xl border px-3.5 py-3 transition ${
                sensor.motionDetected ? 'border-moss/40 bg-moss-wash/70' : 'border-bark-line bg-parchment-paper'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13.5px] font-semibold">{sensor.name}</span>
                <MotionIcon className={`w-4 h-4 shrink-0 ${sensor.motionDetected ? 'text-moss animate-breathe' : 'text-bark-line'}`} />
              </div>
              <div className="mt-0.5 text-[12px] text-bark-mute">
                {sensor.motionDetected ? 'Someone’s here now' : `Quiet · ${ago(sensor.lastMotionTime)}`}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Smoke & CO */}
      <section className="space-y-2.5">
        <div className="eyebrow">Smoke &amp; CO listener</div>
        <div className={`rounded-2xl border p-4 ${alarm ? 'border-ember bg-ember-wash' : 'border-bark-line bg-parchment-paper shadow-leaf'}`}>
          <div className="flex items-start gap-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${alarm ? 'bg-ember text-parchment-paper animate-breathe' : 'bg-parchment-deep text-bark-soft'}`}>
              <SmokeIcon className="w-[18px] h-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className={`text-[14.5px] font-semibold ${alarm ? 'text-ember-deep' : ''}`}>Kitchen smoke alarm</h3>
                <span className="text-[12px] text-bark-mute">Battery {smokeCO.battery}%</span>
              </div>
              <p className={`mt-0.5 text-[13px] ${alarm ? 'text-ember-deep' : 'text-bark-soft'}`}>
                {alarm
                  ? 'The smoke alarm is sounding. The camera has turned to the stove.'
                  : 'Listening for the smoke and CO alarm patterns, so even an old alarm can call for help.'}
              </p>
              <div className="mt-2.5 flex justify-end">
                <button
                  onClick={onSimulateSmokeAlarm}
                  className={alarm ? 'btn-ghost !px-3 !py-1 !text-[12px]' : 'btn !px-3 !py-1 !text-[12px] border border-ember/40 text-ember-deep hover:bg-ember-wash'}
                >
                  {alarm ? 'Reset alarm' : 'Try: smoke alarm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
