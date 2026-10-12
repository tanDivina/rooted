'use client'

import React from 'react'
import { DeviceTelemetry, EscalationStatus } from '@/lib/types/care'
import { ShieldCheck, Wifi, BatteryCharging, Radio, HeartPulse, ShieldAlert } from 'lucide-react'

interface CareTelemetryBarProps {
  telemetry: DeviceTelemetry
  escalation: EscalationStatus
}

export function CareTelemetryBar({ telemetry, escalation }: CareTelemetryBarProps) {
  return (
    <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Ring Device Status */}
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${telemetry.online ? 'bg-emerald-400 animate-pulse' : 'bg-red-500 animate-ping'}`} />
          <span className="text-slate-400">Ring Camera:</span>
          <span className={`font-semibold font-mono ${telemetry.online ? 'text-emerald-300' : 'text-red-400 font-bold'}`}>
            {telemetry.online ? 'ONLINE (WebRTC)' : 'OFFLINE (Cellular Active)'}
          </span>
        </div>

        <div className="hidden sm:block h-3 w-[1px] bg-slate-800" />

        {/* Heartbeat Liveness */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <HeartPulse className="w-3.5 h-3.5 text-cyan-400" />
          <span>Heartbeat:</span>
          <span className="font-mono text-cyan-300">10s Sync Active</span>
        </div>

        <div className="hidden sm:block h-3 w-[1px] bg-slate-800" />

        {/* Redundant Backup Circuit */}
        <div className="flex items-center gap-1.5 text-slate-400">
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>Out-of-Band Backup:</span>
          <span className="font-mono text-amber-300">Secondary Cellular Ready</span>
        </div>

        <div className="hidden sm:block h-3 w-[1px] bg-slate-800" />

        {/* Battery & Signal */}
        <div className="flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono text-slate-300">{telemetry.batteryLevel || 94}%</span>
          </span>
          <span className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-slate-300">-52 dBm</span>
          </span>
        </div>
      </div>

      {/* Right: Dead-Man's Status */}
      <div className="flex items-center gap-2">
        {escalation.active ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-950/80 border border-red-500/80 text-red-300 font-semibold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>Dead-Man's Switch: ARMED ({escalation.secondsRemaining}s)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Guardian Sentinel: Guarding Resident</span>
          </div>
        )}
      </div>
    </div>
  )
}
