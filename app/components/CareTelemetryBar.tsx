'use client'

import React from 'react'
import { DeviceTelemetry, EscalationStatus } from '@/lib/types/care'
import { CameraIcon, SapIcon, CellIcon, BatteryIcon, SignalIcon } from './icons'

interface CareTelemetryBarProps {
  telemetry: DeviceTelemetry
  escalation: EscalationStatus
}

/** "Root system" health: everything that has to hold for Rooted to keep watch. */
export function CareTelemetryBar({ telemetry, escalation }: CareTelemetryBarProps) {
  const item = 'flex items-center gap-2 text-[13px]'
  const label = 'text-bark-mute'
  return (
    <div className="mx-6 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bark-line bg-parchment-paper/80 px-5 py-2.5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="eyebrow">Root system</span>

        <div className={item}>
          <CameraIcon className={`w-4 h-4 ${telemetry.online ? 'text-moss' : 'text-ember'}`} />
          <span className={label}>Camera</span>
          <span className={`font-medium ${telemetry.online ? 'text-moss-deep' : 'text-ember'}`}>
            {telemetry.online ? 'Online' : 'Offline'}
          </span>
        </div>

        <div className={item}>
          <SapIcon className="w-4 h-4 text-moss" />
          <span className={label}>Heartbeat</span>
          <span className="font-medium">every {telemetry.heartbeatIntervalSec}s</span>
        </div>

        <div className={item}>
          <CellIcon className={`w-4 h-4 ${telemetry.online ? 'text-bark-soft' : 'text-honey'}`} />
          <span className={label}>Cellular backup</span>
          <span className={`font-medium ${telemetry.online ? '' : 'text-honey'}`}>
            {telemetry.online ? 'Ready' : 'Carrying alerts'}
          </span>
        </div>

        <div className={`${item} text-bark-soft`}>
          <BatteryIcon className="w-4 h-4" />
          <span className="font-medium text-bark">{telemetry.batteryLevel ?? 94}%</span>
          <SignalIcon className="w-4 h-4 ml-2" />
          <span className="font-medium text-bark">{(telemetry.wifiSignal || '-52 dBm').split(' ').slice(0, 2).join(' ')}</span>
        </div>
      </div>

      {escalation.active ? (
        <span className="rounded-full bg-ember-wash px-3 py-1 text-[13px] font-semibold text-ember-deep">
          Check-in countdown: {escalation.secondsRemaining}s
        </span>
      ) : (
        <span className="rounded-full bg-moss-wash px-3 py-1 text-[13px] font-medium text-moss-deep">
          Keeping watch, quietly
        </span>
      )}
    </div>
  )
}
