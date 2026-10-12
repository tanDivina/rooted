'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useVideoProcessing } from '@/lib/video-processors/useVideoProcessing'
import '@/lib/video-processors' // Register built-in & caretaking processors
import { fallDetectionProcessor } from '@/lib/video-processors/care/fall-detection'
import { stoveHazardProcessor } from '@/lib/video-processors/care/stove-hazard'
import { voiceDistressProcessor } from '@/lib/video-processors/care/voice-distress'
import { failSafeSentinelProcessor } from '@/lib/video-processors/care/failsafe-sentinel'

import { Header } from './components/Header'
import { EventPanel } from './components/EventPanel'
import { ProcessorPanel } from './components/ProcessorPanel'
import { CareIncidentModal } from './components/CareIncidentModal'
import { CareScenarioSelector } from './components/CareScenarioSelector'
import { CareTelemetryBar } from './components/CareTelemetryBar'
import { CaregiverTimeline } from './components/CaregiverTimeline'
import { useWebRTCStream } from './hooks/useWebRTCStream'
import { useEventStream } from './hooks/useEventStream'
import { useCanvasOverlay } from './hooks/useCanvasOverlay'
import { CareIncident, DeviceTelemetry, EscalationStatus } from '@/lib/types/care'
import { TreeMark, PlayIcon, StopIcon, SignalOffIcon, RingsIcon, RootsIcon, SapIcon } from './components/icons'

type RightPanelTab = 'incidents' | 'processors' | 'events'
type AuthMode = 'access_token' | 'refresh_token' | null

export default function Dashboard() {
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('incidents')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined)
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Caretaking State
  const [incidents, setIncidents] = useState<CareIncident[]>([
    {
      id: 'init-1',
      type: 'routine_inactivity',
      severity: 'low',
      timestamp: Date.now() - 3600000,
      title: 'Up and about: morning routine',
      description: 'Out of bed at 7:42 and moving easily through the bedroom. A normal morning.',
      confidence: 0.99,
      resolved: true,
      escalationLevel: 0,
    },
  ])
  const [activeIncident, setActiveIncident] = useState<CareIncident | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>({
    deviceId: 'ring-guardian-living-room',
    name: 'Living Room Sentinel Cam',
    online: true,
    lastHeartbeat: Date.now(),
    batteryLevel: 94,
    wifiSignal: '-52 dBm',
    heartbeatIntervalSec: 10,
    cloudSentinelActive: true,
    deadMansSwitchArmed: false,
    activeIncident: null,
  })
  const [escalation, setEscalation] = useState<EscalationStatus>({
    active: false,
    incidentId: null,
    secondsRemaining: 45,
    totalSeconds: 45,
    level: 1,
    levelLabel: 'Level 1: In-Home Voice & Chime Verification',
    aborted: false,
    acknowledgedBy: null,
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Incident handler
  const handleNewIncident = useCallback((incident: CareIncident) => {
    setIncidents((prev) => [incident, ...prev])
    setActiveIncident(incident)
    failSafeSentinelProcessor.armDeadMansSwitch(incident)
  }, [])

  // Wire processor incident callbacks
  useEffect(() => {
    fallDetectionProcessor.setIncidentCallback(handleNewIncident)
    stoveHazardProcessor.setIncidentCallback(handleNewIncident)
    voiceDistressProcessor.setIncidentCallback(handleNewIncident)
    failSafeSentinelProcessor.setCallbacks((t, e) => {
      setTelemetry(t)
      setEscalation({ ...e })
    }, handleNewIncident)
  }, [handleNewIncident])

  // Drive the check-in countdown once per second while an alert is open
  useEffect(() => {
    if (!escalation.active) return
    const timer = setInterval(() => failSafeSentinelProcessor.tickEscalation(), 1000)
    return () => clearInterval(timer)
  }, [escalation.active])

  // When the countdown runs out with no answer, send the dispatch once
  const autoDispatched = useRef<string | null>(null)
  useEffect(() => {
    if (!escalation.active || escalation.secondsRemaining > 0 || !escalation.incidentId) return
    if (autoDispatched.current === escalation.incidentId) return
    autoDispatched.current = escalation.incidentId
    fetch('/api/care/escalation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incidentId: escalation.incidentId, level: 3, action: 'AUTO_DISPATCH_NO_RESPONSE' }),
    }).catch(console.error)
  }, [escalation.active, escalation.secondsRemaining, escalation.incidentId])

  // Fetch auth mode on mount
  useEffect(() => {
    fetch('/api/ring/config')
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setAuthMode(data.mode)
        }
      })
      .catch((err) => console.warn('Config fetch note:', err))
      .finally(() => setLoading(false))
  }, [])

  // Auto-discover device if authenticated
  useEffect(() => {
    if (!authMode) return
    fetch('/api/ring/devices')
      .then((res) => res.json())
      .then((data) => {
        if (data.devices && data.devices.length > 0) {
          setDeviceId(data.devices[0].id)
        } else {
          setDeviceError(data.error || 'No Ring devices found')
        }
      })
      .catch((err) => setDeviceError(err.message))
  }, [authMode])

  // Custom hooks
  const { streamActive, streamError, startStream, stopStream } = useWebRTCStream({ videoRef, deviceId })
  const { events, connected } = useEventStream({})
  const { processors, results, toggleProcessor, enabledCount } = useVideoProcessing({
    video: videoRef.current,
    canvas: canvasRef.current,
    enabled: true,
    fps: 10,
  })

  // Canvas overlay rendering
  useCanvasOverlay({ videoRef, canvasRef, events, results })

  // Set webhook URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWebhookUrl(`${window.location.origin}/api/webhook`)
    }
  }, [])

  // Cancel / Acknowledge active alarm
  const handleCancelAlarm = () => {
    failSafeSentinelProcessor.cancelAlarm('Resident Voice Confirmation: OK')
    if (activeIncident) {
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === activeIncident.id ? { ...inc, resolved: true } : inc))
      )
    }
    setActiveIncident(null)
  }

  // Immediate dispatch button
  const handleImmediateDispatch = () => {
    if (activeIncident) {
      fetch('/api/care/escalation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId: activeIncident.id,
          level: 3,
          action: 'MANUAL_IMMEDIATE_DISPATCH',
        }),
      }).catch(console.error)
      setIncidents((prev) => prev.map((inc) => (inc.id === activeIncident.id ? { ...inc, escalationLevel: 3 } : inc)))
    }
    handleCancelAlarm()
  }

  // Save token directly
  const handleSaveToken = async (token: string) => {
    try {
      setAuthMode('access_token')
      // Discover devices with token
      const res = await fetch('/api/ring/devices')
      const data = await res.json()
      if (data.devices?.[0]?.id) {
        setDeviceId(data.devices[0].id)
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Active demo video state
  const [activeVideoSrc, setActiveVideoSrc] = useState<string | null>(null)

  // Simulated scenario triggers
  const triggerFallScenario = () => {
    setActiveVideoSrc('/videos/fall-scenario.mp4')
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.src = '/videos/fall-scenario.mp4'
      videoRef.current.loop = true
      videoRef.current.play().catch(console.error)
    }
    fallDetectionProcessor.triggerSimulatedFall()
  }

  const triggerStoveScenario = () => {
    setActiveVideoSrc('/videos/stove-scenario.mp4')
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.src = '/videos/stove-scenario.mp4'
      videoRef.current.loop = true
      videoRef.current.play().catch(console.error)
    }
    stoveHazardProcessor.triggerSimulatedHazard()
  }

  const triggerVoiceScenario = () => {
    voiceDistressProcessor.triggerSimulatedDistress('Help me, I can’t get up!')
  }

  const toggleOfflineSimulation = () => {
    failSafeSentinelProcessor.toggleSimulatedOffline()
    setIsOffline((prev) => !prev)
  }

  const tabs: { id: RightPanelTab; label: string; Icon: typeof RingsIcon; count?: number }[] = [
    { id: 'incidents', label: 'Growth rings', Icon: RingsIcon, count: incidents.length },
    { id: 'processors', label: 'Roots', Icon: RootsIcon, count: enabledCount || undefined },
    { id: 'events', label: 'Signals', Icon: SapIcon },
  ]

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        connected={streamActive}
        enabledCount={enabledCount}
        hasActiveAlert={escalation.active}
        alertTitle={activeIncident?.title}
      />

      <CareScenarioSelector
        onTriggerFall={triggerFallScenario}
        onTriggerStove={triggerStoveScenario}
        onTriggerVoice={triggerVoiceScenario}
        onToggleOffline={toggleOfflineSimulation}
        isOffline={isOffline}
        onSaveToken={handleSaveToken}
        hasToken={!!authMode}
      />

      <CareTelemetryBar telemetry={telemetry} escalation={escalation} />

      <div className="flex-1 flex gap-5 min-h-0 px-6 pb-5">
        {/* Left: the window into the home */}
        <section className="w-[60%] flex flex-col gap-2 min-w-0">
          <div className="relative flex-1 overflow-hidden rounded-[28px] bg-[#2B2019] shadow-leaf ring-1 ring-bark/10 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {streamActive && (
              <span className="absolute top-4 left-4 z-30 flex items-center gap-2 rounded-full bg-bark/70 px-3 py-1.5 text-[12px] font-medium text-parchment-paper backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-moss-soft animate-breathe" />
                Living room · live
              </span>
            )}

            {activeVideoSrc && !streamActive && (
              <span className="absolute top-4 left-4 z-30 flex items-center gap-2 rounded-full bg-bark/80 px-3 py-1.5 text-[12px] font-medium text-parchment-paper backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-honey animate-pulse" />
                Scenario footage active · Sentinel evaluating
              </span>
            )}

            {isOffline && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-[#2B2019]/90 p-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-honey text-parchment-paper">
                  <SignalOffIcon className="w-7 h-7" />
                </span>
                <h3 className="font-serif text-2xl font-semibold text-parchment-paper">The camera went quiet</h3>
                <p className="max-w-md text-sm leading-relaxed text-parchment-deep/80">
                  Wi-Fi or power is down. The roots still hold: Rooted noticed the missing heartbeat and is carrying
                  alerts over the cellular backup.
                </p>
              </div>
            )}

            {!streamActive && !activeVideoSrc && !isOffline && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-gradient-to-b from-parchment-paper to-parchment p-8 text-center">
                <TreeMark className="w-28 h-28 animate-sway" />
                <h3 className="font-serif text-[26px] font-semibold text-bark mt-1">Watching over the living room</h3>
                <p className="max-w-md text-sm leading-relaxed text-bark-soft">
                  Connect a Ring camera to see the live view, or try one of the moments above to see how Rooted
                  reaches out when something’s wrong.
                </p>
                <div className="flex items-center gap-2 pt-3">
                  <button onClick={startStream} disabled={!deviceId} className="btn-moss">
                    <PlayIcon className="w-4 h-4" />
                    {deviceId ? 'Start live view' : 'Waiting for a Ring camera…'}
                  </button>
                  <button onClick={triggerFallScenario} className="btn-ghost">
                    See a demo
                  </button>
                </div>
                {streamError && <p className="text-ember text-xs mt-1">{streamError}</p>}
                {deviceError && <p className="text-bark-mute text-xs mt-1">{deviceError}</p>}
              </div>
            )}

            {activeVideoSrc && !streamActive && (
              <button
                onClick={() => {
                  setActiveVideoSrc(null)
                  if (videoRef.current) {
                    videoRef.current.pause()
                    videoRef.current.src = ''
                  }
                }}
                className="absolute top-4 right-4 z-30 flex items-center gap-1.5 rounded-full bg-parchment-paper/90 px-3 py-1.5 text-[12px] font-semibold text-bark shadow-leaf transition hover:bg-parchment-paper active:scale-95"
              >
                <StopIcon className="w-3 h-3" />
                Reset view
              </button>
            )}

            {streamActive && (
              <button
                onClick={stopStream}
                className="absolute top-4 right-4 z-30 flex items-center gap-1.5 rounded-full bg-parchment-paper/90 px-3 py-1.5 text-[12px] font-semibold text-bark shadow-leaf transition hover:bg-parchment-paper active:scale-95"
              >
                <StopIcon className="w-3 h-3" />
                Stop live view
              </button>
            )}
          </div>

          <div className="flex items-center justify-between px-2 text-[12px] text-bark-mute">
            <span>Ring Partner API · WebRTC (WHEP) · MediaPipe Pose</span>
            <span>~120 ms · 1080p · 30 fps</span>
          </div>
        </section>

        {/* Right: rings, roots and signals */}
        <aside className="w-[40%] flex flex-col min-w-0 rounded-[28px] border border-bark-line bg-parchment-paper/70">
          <nav className="flex items-center gap-1.5 p-3">
            {tabs.map(({ id, label, Icon, count }) => (
              <button
                key={id}
                onClick={() => setRightPanelTab(id)}
                className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-medium transition ${
                  rightPanelTab === id ? 'bg-bark text-parchment-paper' : 'text-bark-soft hover:bg-parchment-deep'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {count !== undefined && (
                  <span className={`rounded-full px-1.5 text-[11px] ${rightPanelTab === id ? 'bg-parchment-paper/20' : 'bg-parchment-deep'}`}>
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {rightPanelTab === 'incidents' && (
            <CaregiverTimeline
              incidents={incidents}
              onAcknowledge={(id) =>
                setIncidents((prev) => prev.map((inc) => (inc.id === id ? { ...inc, resolved: true } : inc)))
              }
            />
          )}
          {rightPanelTab === 'processors' && (
            <ProcessorPanel processors={processors} results={results} onToggle={toggleProcessor} />
          )}
          {rightPanelTab === 'events' && <EventPanel events={events} webhookUrl={webhookUrl} />}
        </aside>
      </div>

      <CareIncidentModal
        incident={activeIncident}
        escalation={escalation}
        onCancel={handleCancelAlarm}
        onImmediateDispatch={handleImmediateDispatch}
      />
    </div>
  )
}
