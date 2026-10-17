'use client'

import React, { useState } from 'react'
import { FallIcon, SproutIcon, KettleIcon, VoiceIcon, SignalOffIcon, KeyIcon, ArrowOutIcon, CloseIcon } from './icons'

interface CareScenarioSelectorProps {
  onTriggerFall: () => void
  onTriggerFallOkay: () => void
  onTriggerStove: () => void
  onTriggerVoice: () => void
  onToggleOffline: () => void
  isOffline: boolean
  onSaveToken: (token: string) => void
  hasToken: boolean
}

export function CareScenarioSelector({
  onTriggerFall,
  onTriggerFallOkay,
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

  const chip =
    'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition active:scale-[0.97]'

  return (
    <div className="mx-6 mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="eyebrow mr-1">Try a moment</span>

        <button onClick={onTriggerFall} className={`${chip} border-ember/30 bg-ember-wash/60 text-ember-deep hover:bg-ember-wash`}>
          <FallIcon className="w-4 h-4" />
          A fall
        </button>
        <button onClick={onTriggerFallOkay} className={`${chip} border-moss/30 bg-moss-wash/60 text-moss-deep hover:bg-moss-wash`}>
          <SproutIcon className="w-4 h-4" />
          A fall, then “I’m okay”
        </button>
        <button onClick={onTriggerStove} className={`${chip} border-honey/30 bg-honey-wash/60 text-[#7a4f12] hover:bg-honey-wash`}>
          <KettleIcon className="w-4 h-4" />
          Stove left on
        </button>
        <button onClick={onTriggerVoice} className={`${chip} border-bark-line bg-parchment-paper text-bark hover:bg-parchment-deep`}>
          <VoiceIcon className="w-4 h-4" />
          A call for help
        </button>
        <button
          onClick={onToggleOffline}
          className={`${chip} ${
            isOffline
              ? 'border-honey bg-honey text-parchment-paper'
              : 'border-bark-line bg-parchment-paper text-bark hover:bg-parchment-deep'
          }`}
        >
          <SignalOffIcon className="w-4 h-4" />
          {isOffline ? 'Wi-Fi down: backup on (restore)' : 'Wi-Fi goes down'}
        </button>
      </div>

      <button
        onClick={() => setShowTokenModal(true)}
        className={hasToken ? 'btn-ghost' : 'btn-moss'}
      >
        <KeyIcon className="w-4 h-4" />
        {hasToken ? 'Ring connected' : 'Connect a Ring camera'}
      </button>

      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bark/40 backdrop-blur-sm p-4">
          <div className="card max-w-md w-full p-7 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="eyebrow">Ring Developer Playground</div>
                <h2 className="font-serif text-2xl font-semibold mt-1">Connect a camera</h2>
              </div>
              <button onClick={() => setShowTokenModal(false)} className="text-bark-mute hover:text-bark" aria-label="Close">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-bark-soft leading-relaxed">
              Paste a temporary access token to stream your Playground camera live into Rooted.
            </p>

            <a
              href="https://developer.amazon.com/ring/console/playground"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-moss/30 bg-moss-wash/60 px-4 py-3 text-sm text-moss-deep hover:bg-moss-wash"
            >
              <span>1. Open the Playground and choose <strong>Generate Token</strong></span>
              <ArrowOutIcon className="w-4 h-4" />
            </a>

            <form onSubmit={handleTokenSubmit} className="flex flex-col gap-3">
              <label className="text-sm font-medium text-bark-soft">2. Paste the token (starts with eyJ…)</label>
              <textarea
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
                rows={4}
                className="w-full rounded-xl border border-bark-line bg-parchment p-3 font-mono text-xs text-bark focus:outline-none focus:border-moss resize-none"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowTokenModal(false)} className="btn-ghost">
                  Cancel
                </button>
                <button type="submit" disabled={!tokenInput.trim()} className="btn-moss">
                  Save and connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
