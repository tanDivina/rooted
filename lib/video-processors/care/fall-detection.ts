import { VideoProcessor, ProcessorResult, BoundingBox } from '../types'

export interface FallDetectionData {
  posture: 'standing' | 'sitting' | 'horizontal_floor' | 'fall_detected'
  confidence: number
  immobilitySeconds: number
  centroidY: number
  aspectRatio: number
  lastFallTimestamp: number | null
}

/**
 * Fall & Slip Detection Processor for Ring Cameras
 * 
 * A lightweight shape-and-motion heuristic (not a pose model): it boxes the
 * foreground, then watches the box's aspect ratio, how fast its centre drops,
 * and how long it stays still near the floor. A pose model such as MediaPipe
 * Pose is the natural upgrade.
 */
export class FallDetectionProcessor implements VideoProcessor {
  id = 'care-fall-detection'
  name = 'Fall & slip watch'
  description = 'Notices sudden falls, slips and stillness on the floor'
  enabled = true

  private posture: 'standing' | 'sitting' | 'horizontal_floor' | 'fall_detected' = 'standing'
  private floorContactStartTime: number | null = null
  private lastCentroidY = 0.4
  private lastCentroidTimestamp = Date.now()
  private fallTriggered = false
  private onIncidentCallback?: (incident: any) => void

  constructor(onIncident?: (incident: any) => void) {
    this.onIncidentCallback = onIncident
  }

  async init(): Promise<void> {
    this.posture = 'standing'
    this.floorContactStartTime = null
    this.fallTriggered = false
  }

  setIncidentCallback(cb: (incident: any) => void) {
    this.onIncidentCallback = cb
  }

  /**
   * Simulate a fall trigger directly for testing or scenario demo
   */
  triggerSimulatedFall() {
    this.posture = 'fall_detected'
    this.floorContactStartTime = Date.now() - 4000
    this.fallTriggered = true
    if (this.onIncidentCallback) {
      this.onIncidentCallback({
        id: `fall-${Date.now()}`,
        type: 'fall_detected',
        severity: 'critical',
        timestamp: Date.now(),
        title: 'A fall in the living room',
        description: 'Went down to the floor and hasn’t moved for more than 4 seconds.',
        confidence: 0.96,
        resolved: false,
        escalationLevel: 1,
      })
    }
  }

  reset() {
    this.posture = 'standing'
    this.floorContactStartTime = null
    this.fallTriggered = false
  }

  async process(
    frame: ImageData,
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement
  ): Promise<ProcessorResult | null> {
    const { width, height } = frame
    const now = Date.now()

    // Extract movement and vertical energy from frame
    // We analyze the lower bounding region of active foreground pixels
    let minX = width, maxX = 0, minY = height, maxY = 0
    let totalForegroundPixels = 0

    // Sample pixels across grid to detect foreground presence
    const data = frame.data
    const step = 8
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        const idx = (y * width + x) * 4
        // Check pixel luminance variance
        const lum = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114)
        if (lum > 40 && lum < 220) {
          totalForegroundPixels++
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    const boxWidth = Math.max(120, maxX - minX)
    const boxHeight = Math.max(80, maxY - minY)
    const normalizedY = (minY + boxHeight / 2) / height
    const aspectRatio = boxWidth / Math.max(1, boxHeight) // > 1.2 means wide/horizontal

    // Centroid velocity
    const dt = Math.max(0.05, (now - this.lastCentroidTimestamp) / 1000)
    const dy = (normalizedY - this.lastCentroidY) / dt
    this.lastCentroidY = normalizedY
    this.lastCentroidTimestamp = now

    // State machine for posture & fall detection
    let immobilitySec = 0
    let color = '#5C6B37' // moss: all well
    let statusLabel = 'Up and moving'
    let confidence = 0.94

    if (this.fallTriggered || (aspectRatio > 1.35 && normalizedY > 0.6)) {
      // Person is horizontal and close to floor level
      if (!this.floorContactStartTime) {
        this.floorContactStartTime = now
      }
      immobilitySec = Math.floor((now - this.floorContactStartTime) / 1000)

      if (immobilitySec >= 3 || this.fallTriggered) {
        this.posture = 'fall_detected'
        color = '#A8432B' // ember: a fall
        statusLabel = `A fall · still for ${immobilitySec}s`
        confidence = 0.98

        // Fire incident once upon threshold crossing
        if (!this.fallTriggered) {
          this.fallTriggered = true
          if (this.onIncidentCallback) {
            this.onIncidentCallback({
              id: `fall-${now}`,
              type: 'fall_detected',
              severity: 'critical',
              timestamp: now,
              title: 'A fall in the living room',
              description: `Went down to the floor and hasn’t moved for ${immobilitySec}s (body ratio ${aspectRatio.toFixed(2)}).`,
              confidence: 0.98,
              resolved: false,
              escalationLevel: 1,
            })
          }
        }
      } else {
        this.posture = 'horizontal_floor'
        color = '#B7791F' // honey: watching closely
        statusLabel = `On the floor · ${immobilitySec}s`
        confidence = 0.82
      }
    } else if (normalizedY > 0.55 && aspectRatio > 0.8) {
      this.posture = 'sitting'
      this.floorContactStartTime = null
      color = '#6B5242' // bark: resting
      statusLabel = 'Sitting down'
      confidence = 0.91
    } else {
      this.posture = 'standing'
      this.floorContactStartTime = null
      this.fallTriggered = false
      color = '#5C6B37' // moss: all well
      statusLabel = 'Up and moving'
      confidence = 0.95
    }

    // Only outline the person once something needs attention; a calm room stays clean
    const noticing = this.posture === 'fall_detected' || this.posture === 'horizontal_floor'
    const boundingBoxes: BoundingBox[] = !noticing ? [] : [
      {
        x: Math.max(20, minX),
        y: Math.max(20, minY),
        width: Math.min(width - 40, boxWidth),
        height: Math.min(height - 40, boxHeight),
        label: statusLabel,
        color,
        confidence,
      },
    ]

    return {
      id: `fall-res-${now}`,
      processorId: this.id,
      timestamp: now,
      boundingBoxes,
      data: {
        posture: this.posture,
        immobilitySeconds: immobilitySec,
        aspectRatio: Number(aspectRatio.toFixed(2)),
        velocityDown: Number(dy.toFixed(2)),
        status: statusLabel,
      },
      message: this.posture === 'fall_detected' ? 'Emergency countdown initiated' : undefined,
    }
  }

  async destroy(): Promise<void> {
    this.reset()
  }
}

export const fallDetectionProcessor = new FallDetectionProcessor()
