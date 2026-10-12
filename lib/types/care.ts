export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'

export type IncidentType =
  | 'fall_detected'
  | 'slip_inactivity'
  | 'stove_unattended'
  | 'voice_distress'
  | 'heartbeat_loss'
  | 'routine_inactivity'
  | 'medication_missed'
  | 'night_wandering'
  | 'smoke_co_alarm'

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

export interface PanTiltState {
  panAngle: number // -180 to 180 degrees
  tiltAngle: number // -45 to 90 degrees
  zoom: number // 1x to 4x
  currentPreset: string
  isMoving: boolean
  autoTracking: boolean
}

export interface ContactSensor {
  id: string
  name: string
  type: 'medicine_cabinet' | 'refrigerator' | 'front_door'
  state: 'closed' | 'open'
  lastChanged: number
  battery: number
  complianceStatus?: 'compliant' | 'warning' | 'pending'
  notes?: string
}

export interface MotionSensor {
  id: string
  name: string
  room: 'living_room' | 'kitchen' | 'hallway' | 'bedroom'
  motionDetected: boolean
  lastMotionTime: number
  battery: number
}

export interface SmokeCOListener {
  id: string
  name: string
  smokeAlarmDetected: boolean
  coAlarmDetected: boolean
  lastTestTime: number
  battery: number
  status: 'normal' | 'smoke_detected' | 'co_detected'
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
  panTilt?: PanTiltState
  contactSensors?: ContactSensor[]
  motionSensors?: MotionSensor[]
  smokeCO?: SmokeCOListener
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
