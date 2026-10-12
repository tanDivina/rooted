'use client'

import React from 'react'
import { ContactSensor, MotionSensor, SmokeCOListener } from '@/lib/types/care'
import {
  Pill,
  Refrigerator,
  DoorClosed,
  DoorOpen,
  Activity,
  Flame,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react'

interface SensorGridProps {
  contactSensors: ContactSensor[]
  motionSensors: MotionSensor[]
  smokeCO: SmokeCOListener
  onSimulateContactOpen: (sensorId: string) => void
  onSimulateSmokeAlarm: () => void
}

export function SensorGrid({
  contactSensors,
  motionSensors,
  smokeCO,
  onSimulateContactOpen,
  onSimulateSmokeAlarm,
}: SensorGridProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col text-xs text-white">
      {/* Header */}
      <div className="border-b border-slate-700/80 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>📡 Ring Alarm Multi-Sensor Fusion</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-cyan-300 font-mono">
              8 Nodes Active
            </span>
          </h2>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Z-Wave Mesh Healthy
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Indoor PIR Motion, Contact Sensors, & Smoke/CO Acoustic Listeners
        </p>
      </div>

      {/* 1. Daily Routine Contact Sensors */}
      <div className="space-y-2">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Contact Sensors (Routines & Adherence)</span>
          <span className="text-cyan-400 text-[10px]">Ring Alarm Contacts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {contactSensors.map((sensor) => {
            const isMedicine = sensor.type === 'medicine_cabinet'
            const isFridge = sensor.type === 'refrigerator'
            const isDoor = sensor.type === 'front_door'

            return (
              <div
                key={sensor.id}
                className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 flex flex-col justify-between gap-2.5 transition hover:border-slate-600"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {isMedicine && <Pill className="w-4 h-4 text-emerald-400" />}
                      {isFridge && <Refrigerator className="w-4 h-4 text-cyan-400" />}
                      {isDoor && (sensor.state === 'open' ? <DoorOpen className="w-4 h-4 text-amber-400" /> : <DoorClosed className="w-4 h-4 text-slate-400" />)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{sensor.name}</h4>
                      <span className="text-[10px] text-slate-400">
                        {sensor.state === 'open' ? (
                          <strong className="text-amber-400">Currently OPEN</strong>
                        ) : (
                          'Closed & Secured'
                        )}
                      </span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    sensor.complianceStatus === 'compliant'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {sensor.complianceStatus === 'compliant' ? 'Verified' : 'Active'}
                  </span>
                </div>

                <div className="bg-slate-950/60 rounded-lg p-2 text-[10px] text-slate-300 flex items-center justify-between">
                  <span className="truncate pr-1">{sensor.notes || 'Routine monitored'}</span>
                  <span className="text-slate-500 font-mono shrink-0">
                    {new Date(sensor.lastChanged).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <button
                  onClick={() => onSimulateContactOpen(sensor.id)}
                  className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-[10px] font-semibold text-slate-300 transition active:scale-95"
                >
                  Simulate {sensor.state === 'open' ? 'Close' : 'Open'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Multi-Room PIR Motion Grid */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Indoor Motion Detectors (PIR Occupancy)</span>
          <span className="text-slate-500 text-[10px]">Room-by-Room Tracking</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {motionSensors.map((sensor) => (
            <div
              key={sensor.id}
              className={`p-2.5 rounded-xl border flex flex-col gap-1.5 transition ${
                sensor.motionDetected
                  ? 'bg-cyan-950/40 border-cyan-500 shadow-sm shadow-cyan-950/50'
                  : 'bg-slate-800/50 border-slate-700/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white truncate">{sensor.name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    sensor.motionDetected ? 'bg-cyan-400 animate-ping' : 'bg-slate-600'
                  }`}
                />
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>{sensor.motionDetected ? 'Active Presence' : 'Idle'}</span>
                <span className="font-mono text-slate-500">
                  {sensor.motionDetected ? 'Now' : '15m ago'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Ring Smoke & CO Acoustic Listener */}
      <div className="space-y-2 pt-1">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Ring Smoke & CO Listener</span>
          <span className="text-slate-500 text-[10px]">UL Acoustic Frequency</span>
        </div>

        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
          smokeCO.smokeAlarmDetected || smokeCO.coAlarmDetected
            ? 'bg-red-950/60 border-red-500 animate-pulse text-red-200'
            : 'bg-slate-800/60 border-slate-700 text-slate-300'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${smokeCO.smokeAlarmDetected ? 'bg-red-500 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}>
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Ring Smoke & CO Listener (Kitchen)</h4>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-900 border border-slate-800 text-cyan-300">
                  Battery: {smokeCO.battery}%
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {smokeCO.smokeAlarmDetected
                  ? '🚨 UL Smoke Siren Detected! Syncing with Kitchen Stove Sentinel'
                  : 'Standing by: Listening for T3 Smoke & T4 CO audio temporal patterns'}
              </p>
            </div>
          </div>

          <button
            onClick={onSimulateSmokeAlarm}
            className="px-3 py-1.5 rounded-lg bg-red-950 hover:bg-red-900 border border-red-800 text-red-300 font-semibold text-[11px] transition shrink-0 active:scale-95"
          >
            {smokeCO.smokeAlarmDetected ? 'Reset Sensor' : 'Test Smoke Alarm'}
          </button>
        </div>
      </div>
    </div>
  )
}
