'use client'

import { VideoProcessor, ProcessorResult } from '@/lib/video-processors/types'
import { FallIcon, KettleIcon, VoiceIcon, SapIcon, RootsIcon } from './icons'

interface ProcessorPanelProps {
  processors: VideoProcessor[]
  results: Map<string, ProcessorResult>
  onToggle: (id: string) => void
}

const ROOT_ICON: Record<string, (p: React.SVGProps<SVGSVGElement>) => JSX.Element> = {
  'care-fall-detection': FallIcon,
  'care-stove-hazard': KettleIcon,
  'care-voice-distress': VoiceIcon,
  'care-failsafe-sentinel': SapIcon,
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-moss' : 'bg-bark-line'}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-parchment-paper shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

function Row({ processor, result, onToggle }: { processor: VideoProcessor; result?: ProcessorResult; onToggle: () => void }) {
  const Icon = ROOT_ICON[processor.id] || RootsIcon
  return (
    <div className="card !p-4">
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${processor.enabled ? 'bg-moss-wash text-moss' : 'bg-parchment-deep text-bark-mute'}`}>
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-[14.5px] font-semibold">{processor.name}</h3>
          <p className="text-[12.5px] text-bark-mute">{processor.description}</p>
        </div>
        <Toggle on={processor.enabled} onClick={onToggle} />
      </div>

      {processor.enabled && result?.data && (
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl bg-parchment px-3 py-2.5 text-[12px]">
          {Object.entries(result.data).map(([key, value]) =>
            key === 'heatmap' || key.startsWith('_') ? null : (
              <div key={key} className="flex justify-between gap-2">
                <dt className="text-bark-mute">{key}</dt>
                <dd className="font-mono text-bark truncate">{String(value)}</dd>
              </div>
            )
          )}
          {result.message && <p className="col-span-2 mt-1 text-honey">{result.message}</p>}
        </dl>
      )}
    </div>
  )
}

/** The four care detectors are the roots; any other registered processors sit below as experiments. */
export function ProcessorPanel({ processors, results, onToggle }: ProcessorPanelProps) {
  const roots = processors.filter((p) => p.id.startsWith('care-'))
  const others = processors.filter((p) => !p.id.startsWith('care-'))

  return (
    <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-3">
      <div className="pt-1 pb-1">
        <h2 className="font-serif text-xl font-semibold">Roots</h2>
        <p className="text-[13px] text-bark-mute">What Rooted listens and looks for, on the live Ring stream.</p>
      </div>

      {roots.map((p) => (
        <Row key={p.id} processor={p} result={results.get(p.id)} onToggle={() => onToggle(p.id)} />
      ))}

      {others.length > 0 && (
        <>
          <div className="eyebrow pt-4">Experiments</div>
          {others.map((p) => (
            <Row key={p.id} processor={p} result={results.get(p.id)} onToggle={() => onToggle(p.id)} />
          ))}
        </>
      )}

      {processors.length === 0 && (
        <p className="py-10 text-center text-sm text-bark-mute">No processors registered yet.</p>
      )}
    </div>
  )
}
