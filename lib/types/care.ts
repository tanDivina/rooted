export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

export type IncidentType =
  | 'fall_detected'
  | 'slip_inactivity'
  | 'stove_unattended'
  | 'voice_distress'
  | 'heartbeat_loss'
  | 'routine_inactivity'

export interface CareIncident {
  id: string
  type: IncidentType
  severity: IncidentSeverity
  timestamp: number
  title: string
  description: string
  confidence: number
  resolved: boolean
  escalationLevel: 0 | 1 | 2 | 3 // 0: Normal, 1: Local In-Home Chime, 2: Caregiver Alert/SMS, 3: Emergency Dispatch
  snapshotUrl?: string
  metadata?: Record<string, any>
}

export interface DeviceTelemetry {
  deviceId: string
  name: string
  online: boolean
  lastHeartbeat: number
  batteryLevel?: number
  wifiSignal?: string
  heartbeatIntervalSec: number
  cloudSentinelActive: boolean
  deadMansSwitchArmed: boolean
  activeIncident: CareIncident | null
}

export interface EscalationStatus {
  active: boolean
  incidentId: string | null
  secondsRemaining: number
  totalSeconds: number
  level: 1 | 2 | 3
  levelLabel: string
  aborted: boolean
  acknowledgedBy: string | null
}
