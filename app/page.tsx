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
import { PanTiltControl } from './components/PanTiltControl'
import { SensorGrid } from './components/SensorGrid'
import { useWebRTCStream } from './hooks/useWebRTCStream'
import { useEventStream } from './hooks/useEventStream'
import { useCanvasOverlay } from './hooks/useCanvasOverlay'
import {
  CareIncident,
  DeviceTelemetry,
  EscalationStatus,
  PanTiltState,
  ContactSensor,
  MotionSensor,
  SmokeCOListener,
} from '@/lib/types/care'
import { TreeMark, PlayIcon, StopIcon, SignalOffIcon, RingsIcon, RootsIcon, SapIcon, SensorsIcon } from './components/icons'

type RightPanelTab = 'incidents' | 'sensors' | 'processors' | 'events'
type AuthMode = 'access_token' | 'refresh_token' | null

export default function Dashboard() {
  const [rightPanelTab, setRightPanelTab] = useState<RightPanelTab>('incidents')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined)
  const [deviceName, setDeviceName] = useState<string | undefined>(undefined)
  const [deviceError, setDeviceError] = useState<string | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Pan-Tilt Camera State
  const [panTilt, setPanTilt] = useState<PanTiltState>({
    panAngle: 0,
    tiltAngle: 15,
    zoom: 1,
    currentPreset: 'Living Room Couch',
    isMoving: false,
    autoTracking: true,
  })

  // Ring Alarm Sensors State
  const [contactSensors, setContactSensors] = useState<ContactSensor[]>([
    {
      id: 'sensor-med',
      name: 'Medicine Cabinet',
      type: 'medicine_cabinet',
      state: 'closed',
      lastChanged: Date.now() - 3600000 * 3,
      battery: 98,
      complianceStatus: 'compliant',
      notes: 'Morning dose taken at 08:24 AM',
    },
    {
      id: 'sensor-fridge',
      name: 'Refrigerator Door',
      type: 'refrigerator',
      state: 'closed',
      lastChanged: Date.now() - 3600000,
      battery: 95,
      complianceStatus: 'compliant',
      notes: '4 openings today (Hydration normal)',
    },
    {
      id: 'sensor-front-door',
      name: 'Front Entry Door',
      type: 'front_door',
      state: 'closed',
      lastChanged: Date.now() - 3600000 * 5,
      battery: 92,
      complianceStatus: 'compliant',
      notes: 'Night wandering monitor armed',
    },
  ])

  const [motionSensors, setMotionSensors] = useState<MotionSensor[]>([
    { id: 'pir-lr', name: 'Living Room', room: 'living_room', motionDetected: true, lastMotionTime: Date.now(), battery: 96 },
    { id: 'pir-kit', name: 'Kitchen Cooktop', room: 'kitchen', motionDetected: false, lastMotionTime: Date.now() - 1800000, battery: 94 },
    { id: 'pir-hall', name: 'Main Hallway', room: 'hallway', motionDetected: false, lastMotionTime: Date.now() - 900000, battery: 97 },
    { id: 'pir-bed', name: 'Master Bedroom', room: 'bedroom', motionDetected: false, lastMotionTime: Date.now() - 21600000, battery: 95 },
  ])

  const [smokeCO, setSmokeCO] = useState<SmokeCOListener>({
    id: 'smoke-kit',
    name: 'Smoke & CO Listener',
    smokeAlarmDetected: false,
    coAlarmDetected: false,
    lastTestTime: Date.now() - 86400000 * 4,
    battery: 100,
    status: 'normal',
  })

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
    panTilt: {
      panAngle: 0,
      tiltAngle: 15,
      zoom: 1,
      currentPreset: 'Living Room Couch',
      isMoving: false,
      autoTracking: true,
    },
    contactSensors: [],
    motionSensors: [],
    smokeCO: {
      id: 'smoke-kit',
      name: 'Smoke & CO Listener',
      smokeAlarmDetected: false,
      coAlarmDetected: false,
      lastTestTime: Date.now(),
      battery: 100,
      status: 'normal',
    },
  })
  const [escalation, setEscalation] = useState<EscalationStatus>({
    active: false,
    incidentId: null,
    secondsRemaining: 45,
    totalSeconds: 45,
    level: 1,
    levelLabel: 'Level 1: In-Home Chime Check',
    aborted: false,
    acknowledgedBy: null,
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // The detectors call back outside React, so they read the open alert through refs
  const activeIncidentRef = useRef<CareIncident | null>(null)
  activeIncidentRef.current = activeIncident
  const escalationRef = useRef(escalation)
  escalationRef.current = escalation

  // A short confirmation when the person answers for themselves (heard, or seen getting up)
  const [resolution, setResolution] = useState<{ title: string; body: string } | null>(null)
  useEffect(() => {
    if (!resolution) return
    const t = setTimeout(() => setResolution(null), 4000)
    return () => clearTimeout(t)
  }, [resolution])

  // Incident handler
  const handleNewIncident = useCallback((incident: CareIncident) => {
    setIncidents((prev) => [incident, ...prev])
    setActiveIncident(incident)
    failSafeSentinelProcessor.armDeadMansSwitch(incident)
  }, [])

  const sendFamilyUpdate = (incident: CareIncident, update: 'says_okay' | 'got_up') =>
    fetch('/api/care/escalation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incident, level: 2, action: 'FAMILY_UPDATE', update }),
    }).catch(console.error)

  // Stand the alert down because the person answered for themselves, and note it in Growth rings
  const resolveIncident = useCallback((incident: CareIncident, reason: string, note: string) => {
    failSafeSentinelProcessor.cancelAlarm(reason)
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === incident.id ? { ...inc, resolved: true, description: `${inc.description} ${note}` } : inc))
    )
    setActiveIncident(null)
  }, [])

  // “I’m okay”, said to the room. Still on the floor after a fall: wait and tell the family gently,
  // because people often say they’re fine when they aren’t. Otherwise it answers the check-in.
  const handleOkayHeard = useCallback((phrase: string) => {
    const incident = activeIncidentRef.current
    const esc = escalationRef.current
    if (!incident || !esc.active || esc.paused) return
    if (incident.type === 'fall_detected' && fallDetectionProcessor.onFloor) {
      failSafeSentinelProcessor.pauseForOkay(`Heard “${phrase}”`)
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === incident.id ? { ...inc, description: `${inc.description} Said “${phrase}” from the floor.` } : inc))
      )
      sendFamilyUpdate(incident, 'says_okay')
      return
    }
    resolveIncident(incident, `Heard “${phrase}”`, `Answered “${phrase}”.`)
    setResolution({ title: 'They answered: “I’m okay.”', body: `Rooted heard “${phrase}” on the camera’s audio, so the alert is stood down.` })
  }, [resolveIncident])

  // Seen back on their feet after a fall: the best answer there is
  const handleRecovered = useCallback(() => {
    const incident = activeIncidentRef.current
    if (!incident || incident.type !== 'fall_detected' || !escalationRef.current.active) return
    resolveIncident(incident, 'Seen getting back up', 'Then got back up.')
    sendFamilyUpdate(incident, 'got_up')
    setResolution({ title: 'Back up.', body: 'The camera saw them get up, so the alert is stood down. The family gets a short note.' })
  }, [resolveIncident])

  // Load the pose and speech models up front, so they are ready before the first frame that matters
  useEffect(() => {
    fallDetectionProcessor.init()
    voiceDistressProcessor.init()
  }, [])

  // Wire processor incident callbacks
  useEffect(() => {
    fallDetectionProcessor.setIncidentCallback(handleNewIncident)
    stoveHazardProcessor.setIncidentCallback(handleNewIncident)
    voiceDistressProcessor.setIncidentCallback(handleNewIncident)
    voiceDistressProcessor.setOkayCallback(handleOkayHeard)
    fallDetectionProcessor.setRecoveredCallback(handleRecovered)
    failSafeSentinelProcessor.setCallbacks((t, e) => {
      setTelemetry(t)
      setEscalation({ ...e })
    }, handleNewIncident)
  }, [handleNewIncident, handleOkayHeard, handleRecovered])

  // Drive the check-in countdown once per second while an alert is open
  useEffect(() => {
    if (!escalation.active) return
    const timer = setInterval(() => failSafeSentinelProcessor.tickEscalation(), 1000)
    return () => clearInterval(timer)
  }, [escalation.active])

  // Step 2: when the countdown reaches the family step, text and email them once
  const familyNotified = useRef<string | null>(null)
  useEffect(() => {
    if (!escalation.active || escalation.level < 2 || !activeIncident) return
    if (familyNotified.current === activeIncident.id) return
    familyNotified.current = activeIncident.id
    fetch('/api/care/escalation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        incident: activeIncident,
        level: 2,
        action: 'FAMILY_ALERT',
        unansweredSeconds: escalation.totalSeconds - escalation.secondsRemaining,
      }),
    }).catch(console.error)
  }, [escalation.active, escalation.level, escalation.totalSeconds, escalation.secondsRemaining, activeIncident])

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
          setDeviceName(data.devices[0].name)
        } else {
          setDeviceError(data.error || 'No Ring devices found')
        }
      })
      .catch((err) => setDeviceError(err.message))
  }, [authMode])

  // Custom hooks
  const { streamActive, receiving, streamError, startStream, stopStream } = useWebRTCStream({ videoRef, deviceId })

  // A live Ring stream: listen to its audio track for calls for help
  useEffect(() => {
    if (streamActive && videoRef.current) voiceDistressProcessor.listenTo(videoRef.current)
  }, [streamActive])
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
    failSafeSentinelProcessor.cancelAlarm('Checked by family or a neighbour')
    // Clear the demo overlays so the view goes back to calm
    fallDetectionProcessor.reset()
    stoveHazardProcessor.reset()
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

  // Scenario triggers
  // The fall clip is real-looking footage that runs through the real pose detector: he stands up
  // from a chair, collapses at ~3s and stays down, so the alert fires after ~4s of stillness.
  // Only if the pose model couldn't load (offline, say) does a scripted alert stand in.
  const fallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const clearFallTimer = () => {
    if (fallTimerRef.current) clearTimeout(fallTimerRef.current)
    fallTimerRef.current = null
  }
  useEffect(() => clearFallTimer, [])

  const triggerFallScenario = () => {
    clearFallTimer()
    setActiveVideoSrc('/videos/fall-living-room.mp4')
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.src = '/videos/fall-living-room.mp4'
      videoRef.current.loop = false
      videoRef.current.play().catch(console.error)
    }
    setPanTilt((p) => ({ ...p, panAngle: 0, tiltAngle: 25, currentPreset: 'Living Room Floor (Auto-Slewed)' }))
    stoveHazardProcessor.reset() // living room footage: no stove zone in view
    fallDetectionProcessor.reset()
    fallTimerRef.current = setTimeout(() => {
      fallTimerRef.current = null
      if (!fallDetectionProcessor.ready) fallDetectionProcessor.triggerSimulatedFall()
    }, 9000)
  }

  // The same fall, but he answers: from the floor he says “I’m okay” (Whisper hears it, so the
  // check-in waits and the family gets a gentle note), then gets up with the chair (pose sees him
  // standing, so the alert stands down).
  const triggerFallOkayScenario = () => {
    clearFallTimer()
    setActiveVideoSrc('/videos/fall-then-okay.mp4')
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.src = '/videos/fall-then-okay.mp4'
      videoRef.current.loop = false
      voiceDistressProcessor.listenTo(videoRef.current) // inside the click, so audio may start
      videoRef.current.play().catch(console.error)
    }
    setPanTilt((p) => ({ ...p, panAngle: 0, tiltAngle: 25, currentPreset: 'Living Room Floor (Auto-Slewed)' }))
    stoveHazardProcessor.reset()
    fallDetectionProcessor.reset()
    voiceDistressProcessor.reset()
    fallTimerRef.current = setTimeout(() => {
      fallTimerRef.current = null
      if (!fallDetectionProcessor.ready) fallDetectionProcessor.triggerSimulatedFall()
    }, 9000)
  }

  const triggerStoveScenario = () => {
    clearFallTimer()
    setActiveVideoSrc('/videos/stove-kitchen.mp4')
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.src = '/videos/stove-kitchen.mp4'
      videoRef.current.loop = true
      videoRef.current.play().catch(console.error)
    }
    setPanTilt((p) => ({ ...p, panAngle: 75, tiltAngle: -10, currentPreset: 'Kitchen Stove (Auto-Slewed)' }))
    fallDetectionProcessor.reset() // kitchen footage: nobody in view
    // Scripted hazard, a few seconds in, so the empty kitchen is seen before the alert covers it
    fallTimerRef.current = setTimeout(() => {
      fallTimerRef.current = null
      stoveHazardProcessor.triggerSimulatedHazard()
    }, 3000)
  }

  // The call-for-help clip shows an empty room: she has fallen out of view, in the hallway,
  // and the camera hears her. Whisper listens to the clip's audio on-device.
  const triggerVoiceScenario = () => {
    clearFallTimer()
    setActiveVideoSrc('/videos/call-for-help.mp4')
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.src = '/videos/call-for-help.mp4'
      videoRef.current.loop = false
      voiceDistressProcessor.listenTo(videoRef.current) // inside the click, so audio may start
      videoRef.current.play().catch(console.error)
    }
    setPanTilt((p) => ({ ...p, panAngle: 0, tiltAngle: 15, currentPreset: 'Living Room (Listening)' }))
    stoveHazardProcessor.reset()
    fallDetectionProcessor.reset()
    voiceDistressProcessor.reset()
    fallTimerRef.current = setTimeout(() => {
      fallTimerRef.current = null
      if (!voiceDistressProcessor.ready) voiceDistressProcessor.triggerSimulatedDistress()
    }, 9000)
  }

  const toggleOfflineSimulation = () => {
    failSafeSentinelProcessor.toggleSimulatedOffline()
    setIsOffline((prev) => !prev)
  }

  const handleSimulateContactOpen = (sensorId: string) => {
    setContactSensors((prev) =>
      prev.map((s) => {
        if (s.id !== sensorId) return s
        const nextState = s.state === 'open' ? 'closed' : 'open'
        const now = Date.now()
        if (nextState === 'open') {
          if (s.type === 'medicine_cabinet') {
            setIncidents((cur) => [
              {
                id: `med-${now}`,
                type: 'routine_inactivity',
                severity: 'low',
                timestamp: now,
                title: 'Medicine taken',
                description: 'The medicine cabinet was opened at the usual time.',
                confidence: 1.0,
                resolved: true,
                escalationLevel: 0,
              },
              ...cur,
            ])
            setPanTilt((p) => ({ ...p, panAngle: -85, tiltAngle: 5, currentPreset: 'Medicine Cabinet (Auto-Slewed)' }))
          } else if (s.type === 'refrigerator') {
            setIncidents((cur) => [
              {
                id: `fridge-${now}`,
                type: 'routine_inactivity',
                severity: 'low',
                timestamp: now,
                title: 'A trip to the fridge',
                description: 'Eating and drinking look on track today.',
                confidence: 1.0,
                resolved: true,
                escalationLevel: 0,
              },
              ...cur,
            ])
          } else if (s.type === 'front_door') {
            setIncidents((cur) => [
              {
                id: `door-${now}`,
                type: 'routine_inactivity',
                severity: 'medium',
                timestamp: now,
                title: 'Front door opened',
                description: 'Heading out, or someone visiting. Rooted will note the return.',
                confidence: 1.0,
                resolved: true,
                escalationLevel: 0,
              },
              ...cur,
            ])
            setPanTilt((p) => ({ ...p, panAngle: 160, tiltAngle: 0, currentPreset: 'Front Door (Auto-Slewed)' }))
          }
        }
        return {
          ...s,
          state: nextState,
          lastChanged: now,
        }
      })
    )
  }

  const handleSimulateSmokeAlarm = () => {
    const nextDetected = !smokeCO.smokeAlarmDetected
    setSmokeCO((prev) => ({
      ...prev,
      smokeAlarmDetected: nextDetected,
      status: nextDetected ? 'smoke_detected' : 'normal',
    }))

    if (nextDetected) {
      const now = Date.now()
      setPanTilt((p) => ({ ...p, panAngle: 75, tiltAngle: -10, currentPreset: 'Kitchen Cooktop (Auto-Slewed)' }))
      handleNewIncident({
        id: `smoke-${now}`,
        type: 'smoke_co_alarm',
        severity: 'critical',
        timestamp: now,
        title: 'The smoke alarm is sounding',
        description: 'The kitchen smoke alarm’s pattern was heard. The camera has turned to the stove.',
        confidence: 0.99,
        resolved: false,
        escalationLevel: 1,
      })
    }
  }

  const tabs: { id: RightPanelTab; label: string; Icon: typeof RingsIcon; count?: number }[] = [
    { id: 'incidents', label: 'Growth rings', Icon: RingsIcon, count: incidents.length },
    { id: 'sensors', label: 'Rhythms', Icon: SensorsIcon, count: contactSensors.length + motionSensors.length },
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
        onTriggerFallOkay={triggerFallOkayScenario}
        onTriggerStove={triggerStoveScenario}
        onTriggerVoice={triggerVoiceScenario}
        onToggleOffline={toggleOfflineSimulation}
        isOffline={isOffline}
        onSaveToken={handleSaveToken}
        hasToken={!!authMode}
      />

      <CareTelemetryBar telemetry={telemetry} escalation={escalation} demo={!streamActive} liveDevice={deviceName} />

      <div className="flex-1 flex gap-5 min-h-0 px-6 pb-5">
        {/* Left: the window into the home + Pan-Tilt controller */}
        <section className="w-[60%] flex flex-col gap-3 min-w-0">
          <div className="relative flex-1 overflow-hidden rounded-[28px] bg-[#2B2019] shadow-leaf ring-1 ring-bark/10 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

            {streamActive && (
              <span className="absolute top-4 left-4 z-30 flex items-center gap-2 rounded-full bg-bark/70 px-3 py-1.5 text-[12px] font-medium text-parchment-paper backdrop-blur">
                <span className={`h-2 w-2 rounded-full ${receiving ? 'bg-moss-soft animate-breathe' : 'bg-honey animate-pulse'}`} />
                {receiving ? `${deviceName || 'Ring camera'} · live` : `Connecting to ${deviceName || 'the Ring camera'}…`}
              </span>
            )}

            {activeVideoSrc && !streamActive && (
              <span className="absolute top-4 left-4 z-30 flex items-center gap-2 rounded-full bg-bark/80 px-3 py-1.5 text-[12px] font-medium text-parchment-paper backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-honey animate-pulse" />
                Demo footage · detectors running
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

          {/* Pan-Tilt Motorized Controller */}
          <PanTiltControl
            panTilt={panTilt}
            onUpdate={(u) => setPanTilt((prev) => ({ ...prev, ...u }))}
          />

          <div className="flex items-center justify-between px-2 text-[12px] text-bark-mute">
            {streamActive ? (
              <>
                <span>Ring Partner API · WebRTC (WHEP) · MediaPipe Pose and Whisper</span>
                <span>Live from {deviceName || 'the Ring camera'}</span>
              </>
            ) : (
              <>
                <span>No Ring camera connected · demo footage through the real detectors</span>
                <span>MediaPipe Pose and Whisper, on this device</span>
              </>
            )}
          </div>
        </section>

        {/* Right: rings, roots, sensors and signals */}
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

          {rightPanelTab === 'sensors' && (
            <SensorGrid
              contactSensors={contactSensors}
              motionSensors={motionSensors}
              smokeCO={smokeCO}
              onSimulateContactOpen={handleSimulateContactOpen}
              onSimulateSmokeAlarm={handleSimulateSmokeAlarm}
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
        resolution={resolution}
      />
    </div>
  )
}
