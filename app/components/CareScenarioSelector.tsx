'use client'

import React, { useState } from 'react'
import {
  Activity,
  Flame,
  Mic,
  WifiOff,
  Video,
  Key,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'

interface CareScenarioSelectorProps {
  currentScenario: string
  onSelectScenario: (scenario: string) => void
  onTriggerFall: () => void
  onTriggerStove: () => void
  onTriggerVoice: () => void
  onToggleOffline: () => void
  isOffline: boolean
  onSaveToken: (token: string) => void
  hasToken: boolean
}

export function CareScenarioSelector({
  currentScenario,
  onSelectScenario,
  onTriggerFall,
  onTriggerStove,
  onTriggerVoice,
  onToggleOffline,
  isOffline,
  onSaveToken,
  hasToken,
}: CareScenarioSelectorProps) {
  const [tokenInput, setTokenInput] = useState('')
  const [showTokenModal, setShowTokenModal] = useState(false)

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tokenInput.trim()) {
      onSaveToken(tokenInput.trim())
      setShowTokenModal(false)
      setTokenInput('')
    }
  }

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left: Mode / Scenario Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-400 font-semibold tracking-wide uppercase text-[11px] flex items-center gap-1.5 mr-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Stream Mode:
        </span>

        <button
          onClick={() => onSelectScenario('live')}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition ${
            currentScenario === 'live'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          Live Ring Playground
        </button>

        <span className="text-slate-600">|</span>

        <span className="text-slate-400 font-semibold uppercase text-[11px]">
          Demo Scenarios:
        </span>

        <button
          onClick={onTriggerFall}
          className="px-3 py-1.5 rounded-lg font-medium bg-red-950/60 border border-red-800/80 text-red-300 hover:bg-red-900/60 flex items-center gap-1.5 transition active:scale-95"
        >
          <Activity className="w-3.5 h-3.5 text-red-400" />
          Test Fall & Slip
        </button>

        <button
          onClick={onTriggerStove}
          className="px-3 py-1.5 rounded-lg font-medium bg-orange-950/60 border border-orange-800/80 text-orange-300 hover:bg-orange-900/60 flex items-center gap-1.5 transition active:scale-95"
        >
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          Test Stove Hazard
        </button>

        <button
          onClick={onTriggerVoice}
          className="px-3 py-1.5 rounded-lg font-medium bg-indigo-950/60 border border-indigo-800/80 text-indigo-300 hover:bg-indigo-900/60 flex items-center gap-1.5 transition active:scale-95"
        >
          <Mic className="w-3.5 h-3.5 text-indigo-400" />
          Test Voice SOS
        </button>

        <button
          onClick={onToggleOffline}
          className={`px-3 py-1.5 rounded-lg font-medium border flex items-center gap-1.5 transition active:scale-95 ${
            isOffline
              ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20 animate-pulse'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          {isOffline ? '⚡ Cellular Backup Active' : 'Simulate Network Cut'}
        </button>
      </div>

      {/* Right: Ring Playground Access Token Manager */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowTokenModal(true)}
          className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 border transition ${
            hasToken
              ? 'bg-slate-800 text-cyan-300 border-cyan-800 hover:bg-slate-700'
              : 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm animate-pulse'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          {hasToken ? 'Ring Token Linked' : 'Connect Ring Playground Token'}
        </button>
      </div>

      {/* Token Modal */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
                <Key className="w-5 h-5" />
                Ring Developer Playground Token
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              To stream live WebRTC feeds from your simulated Ring camera in the
              Playground, paste your temporary access token below:
            </p>

            <a
              href="https://developer.amazon.com/ring/console/playground"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-cyan-950/40 border border-cyan-800 rounded-xl flex items-center justify-between text-xs text-cyan-300 hover:bg-cyan-900/40 transition"
            >
              <span>1. Open Ring Playground & click <strong>Generate Token</strong></span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <form onSubmit={handleTokenSubmit} className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-slate-400">
                Paste Token (Starts with eyJ...):
              </label>
              <textarea
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 resize-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!tokenInput.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs"
                >
                  Save & Connect Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
