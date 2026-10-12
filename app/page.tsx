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
import { AlertTriangle, Video, Play, Square, Shield } from 'lucide-react'

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
      title: 'Morning Routine Check: Bedroom Zone',
      description: 'Resident awoke and initiated morning movement sequence at 07:42 AM. Normal mobility registered.',
      confidence: 0.99,
      resolved: true,
      escalationLevel: 0,
    },
  ])
  const [activeIncident, setActiveIncident] = useState<CareIncident | null>(null)
  const [currentScenario, setCurrentScenario] = useState('live')
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

  // Simulated scenario triggers
  const triggerFallScenario = () => {
    fallDetectionProcessor.triggerSimulatedFall()
  }

  const triggerStoveScenario = () => {
    stoveHazardProcessor.triggerSimulatedHazard()
  }

  const triggerVoiceScenario = () => {
    voiceDistressProcessor.triggerSimulatedDistress('HELP ME, I CANNOT GET UP!')
  }

  const toggleOfflineSimulation = () => {
    failSafeSentinelProcessor.toggleSimulatedOffline()
    setIsOffline((prev) => !prev)
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden">
      {/* Header */}
      <Header
        connected={streamActive}
        enabledCount={enabledCount}
        hasActiveAlert={escalation.active}
      />

      {/* Scenario & Token Switcher Bar */}
      <CareScenarioSelector
        currentScenario={currentScenario}
        onSelectScenario={setCurrentScenario}
        onTriggerFall={triggerFallScenario}
        onTriggerStove={triggerStoveScenario}
        onTriggerVoice={triggerVoiceScenario}
        onToggleOffline={toggleOfflineSimulation}
        isOffline={isOffline}
        onSaveToken={handleSaveToken}
        hasToken={!!authMode}
      />

      {/* Real-time Telemetry & Heartbeat Bar */}
      <CareTelemetryBar telemetry={telemetry} escalation={escalation} />

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Video Stream Viewport (60% width) */}
        <div className="w-[62%] p-3.5 flex flex-col gap-2">
          <div className="relative flex-1 bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex items-center justify-center">
            {/* Live WebRTC Video element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />

            {/* Canvas Overlay for Pose Skeletons, Bounding Boxes, Stove ROI */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />

            {/* Offline overlay notice if simulated network cut */}
            {isOffline && (
              <div className="absolute inset-0 bg-red-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="p-3 bg-red-600 text-white rounded-full mb-3 animate-ping">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">
                  Primary Ring Stream Disconnected
                </h3>
                <p className="text-sm text-red-200 max-w-md">
                  Redundant Fail-Safe Sentinel engaged: Cloud dead-man's heartbeat monitor active via secondary cellular channel.
                </p>
              </div>
            )}

            {/* Inactive Stream Controls / Connect Button */}
            {!streamActive && !isOffline && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/90 p-6 text-center z-10">
                <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-1 shadow-lg shadow-cyan-950/50">
                  <Video className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-white">Ring Camera Stream Ready</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Connect live WebRTC feed from Ring Developer Playground, or click any demo button above to test real-time AI caretaking algorithms.
                </p>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={startStream}
                    disabled={!deviceId}
                    className={`px-5 py-2.5 font-bold rounded-xl text-xs flex items-center gap-2 transition ${
                      deviceId
                        ? 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 active:scale-95'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {deviceId ? 'Start Live Ring Stream' : '⏳ Readying Ring Device...'}
                  </button>

                  <button
                    onClick={triggerFallScenario}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold rounded-xl transition"
                  >
                    Run Demo Scenario
                  </button>
                </div>

                {streamError && <p className="text-red-400 text-xs mt-1">{streamError}</p>}
                {deviceError && <p className="text-slate-500 text-xs mt-1">{deviceError}</p>}
              </div>
            )}

            {/* Stop Stream Overlay Button */}
            {streamActive && (
              <button
                onClick={stopStream}
                className="absolute top-3 right-3 px-3 py-1.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-1.5 transition active:scale-95 z-30"
              >
                <Square className="w-3 h-3 fill-current" />
                Stop Stream
              </button>
            )}
          </div>

          {/* Webhook helper & status note */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span>
              Ring Partner API (Amazon Vision API) • WebRTC WHEP Engine • MediaPipe Pose
            </span>
            <span className="font-mono text-cyan-400/80">
              Latency: ~120ms • 1080p 30fps
            </span>
          </div>
        </div>

        {/* Right Panel: Incidents, Processors, Webhook events (38% width) */}
        <div className="w-[38%] border-l border-slate-800 flex flex-col bg-slate-900/50">
          {/* Tabs */}
          <div className="p-3 border-b border-slate-800 flex items-center gap-2">
            <button
              onClick={() => setRightPanelTab('incidents')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                rightPanelTab === 'incidents'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <span>Caregiver Log</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/80 text-cyan-300">
                {incidents.length}
              </span>
            </button>

            <button
              onClick={() => setRightPanelTab('processors')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                rightPanelTab === 'processors'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <span>AI Sentinels</span>
              {enabledCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/80 text-cyan-300">
                  {enabledCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setRightPanelTab('events')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
                rightPanelTab === 'events'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <span>Webhooks</span>
            </button>
          </div>

          {/* Tab Views */}
          {rightPanelTab === 'incidents' && (
            <CaregiverTimeline
              incidents={incidents}
              onAcknowledge={(id) =>
                setIncidents((prev) =>
                  prev.map((inc) => (inc.id === id ? { ...inc, resolved: true } : inc))
                )
              }
            />
          )}

          {rightPanelTab === 'processors' && (
            <ProcessorPanel
              processors={processors}
              results={results}
              onToggle={toggleProcessor}
            />
          )}

          {rightPanelTab === 'events' && (
            <EventPanel events={events} webhookUrl={webhookUrl} />
          )}
        </div>
      </div>

      {/* Emergency Active Modal (Dead-Man's Escalation Counter) */}
      <CareIncidentModal
        incident={activeIncident}
        escalation={escalation}
        onCancel={handleCancelAlarm}
        onImmediateDispatch={handleImmediateDispatch}
      />
    </div>
  )
}
