'use client'

import React from 'react'
import { Shield, Radio, HeartPulse } from 'lucide-react'

interface HeaderProps {
  connected: boolean
  enabledCount: number
  hasActiveAlert?: boolean
}

export function Header({ connected, enabledCount, hasActiveAlert }: HeaderProps) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-cyan-900/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-white tracking-tight">
              RingCare <span className="text-cyan-400">Guardian</span>
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-800">
              Amazon Ring Hackathon
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Autonomous Aging-in-Place Video Sentinel & Redundant Fail-Safe Backup
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {hasActiveAlert ? (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500 text-red-200 text-xs font-bold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Active Emergency Triggered
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            System Guarding
          </div>
        )}

        <div className="hidden md:flex items-center gap-2 text-xs">
          <span className={`px-2.5 py-1 rounded-full border ${connected ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            {connected ? '● Ring Stream Ready' : '○ Standby'}
          </span>
          {enabledCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-800 text-indigo-300">
              {enabledCount} AI Sentinels Active
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
