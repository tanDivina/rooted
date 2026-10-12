'use client'

import React from 'react'
import Link from 'next/link'
import { TreeMark, LeafIcon } from './icons'

interface HeaderProps {
  connected: boolean
  enabledCount: number
  hasActiveAlert?: boolean
  alertTitle?: string
}

export function Header({ connected, enabledCount, hasActiveAlert, alertTitle }: HeaderProps) {
  return (
    <header className="px-6 pt-5 pb-4 flex items-center justify-between gap-6 shrink-0">
      <div className="flex items-center gap-3.5">
        <TreeMark className="w-12 h-12 animate-sway" />
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="font-serif text-[30px] leading-none font-semibold tracking-tight text-bark">
              Rooted
            </h1>
            <span className="font-serif italic text-moss text-lg leading-none">stay rooted</span>
          </div>
          <p className="text-[13px] text-bark-mute mt-1">
            You can’t transplant an old tree. So we bring the care to its roots.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {hasActiveAlert ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-ember text-parchment-paper text-sm font-semibold shadow-leaf">
            <span className="w-2 h-2 rounded-full bg-parchment-paper animate-breathe" />
            Reaching out{alertTitle ? `: ${alertTitle}` : ''}
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-moss-wash text-moss-deep text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-moss animate-breathe" />
            All’s well at home
          </div>
        )}

        <div className="hidden lg:flex items-center gap-2 text-[13px]">
          <span className="px-3 py-2 rounded-full border border-bark-line bg-parchment-paper text-bark-soft">
            {connected ? 'Camera live' : 'Camera resting'}
          </span>
          {enabledCount > 0 && (
            <span className="px-3 py-2 rounded-full border border-bark-line bg-parchment-paper text-bark-soft">
              {enabledCount} roots watching
            </span>
          )}
        </div>

        <Link href="/why" className="btn-ghost">
          <LeafIcon className="w-4 h-4 text-moss" />
          Why stay rooted
        </Link>
      </div>
    </header>
  )
}
