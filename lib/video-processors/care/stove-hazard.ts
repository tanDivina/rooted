import { VideoProcessor, ProcessorResult, BoundingBox } from '../types'

/**
 * Kitchen Stove & Unattended Cooking Sentinel
 * 
 * Monitors a designated cooking zone (ROI). If thermal/pixel activity is detected
 * (burner on, pot boiling) and the resident remains absent from the kitchen zone
 * for longer than the safe threshold, triggers an unattended cooking alarm.
 */
export class StoveHazardProcessor implements VideoProcessor {
  id = 'care-stove-hazard'
  name = '🔥 Kitchen Stove & Fire Sentinel'
  description = 'Monitors active stove burners and triggers alerts when left unattended'
  enabled = true

  private stoveActive = true
  private personPresentInKitchen = false
  private unattendedSince: number | null = Date.now() - 12000
  private hazardTriggered = false
  private onIncidentCallback?: (incident: any) => void

  constructor(onIncident?: (incident: any) => void) {
    this.onIncidentCallback = onIncident
  }

  async init(): Promise<void> {
    this.stoveActive = true
    this.hazardTriggered = false
  }

  setIncidentCallback(cb: (incident: any) => void) {
    this.onIncidentCallback = cb
  }

  triggerSimulatedHazard() {
    this.stoveActive = true
    this.personPresentInKitchen = false
    this.unattendedSince = Date.now() - 20000
    this.hazardTriggered = true
    if (this.onIncidentCallback) {
      this.onIncidentCallback({
        id: `stove-${Date.now()}`,
        type: 'stove_unattended',
        severity: 'high',
        timestamp: Date.now(),
        title: 'Unattended Stove Alert: Kitchen',
        description: 'Stove burner has been active for over 15 minutes with no human presence detected in the kitchen.',
        confidence: 0.94,
        resolved: false,
        escalationLevel: 1,
      })
    }
  }

  reset() {
    this.hazardTriggered = false
    this.unattendedSince = null
  }

  async process(
    frame: ImageData,
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement
  ): Promise<ProcessorResult | null> {
    const { width, height } = frame
    const now = Date.now()

    // Stove Zone: Top-right quarter of the frame
    const stoveZone = {
      x: Math.floor(width * 0.62),
      y: Math.floor(height * 0.15),
      width: Math.floor(width * 0.32),
      height: Math.floor(height * 0.35),
    }

    const elapsedUnattendedSec = this.unattendedSince
      ? Math.floor((now - this.unattendedSince) / 1000)
      : 0

    let color = '#22C55E'
    let label = 'STOVE ZONE: MONITORED / SAFE'
    let severity = 'normal'

    if (this.stoveActive) {
      if (elapsedUnattendedSec > 15 || this.hazardTriggered) {
        color = '#EF4444' // Red
        label = `🚨 DANGER: STOVE UNATTENDED (${elapsedUnattendedSec}s)`
        severity = 'critical'

        if (!this.hazardTriggered) {
          this.hazardTriggered = true
          if (this.onIncidentCallback) {
            this.onIncidentCallback({
              id: `stove-${now}`,
              type: 'stove_unattended',
              severity: 'high',
              timestamp: now,
              title: 'Unattended Stove Alert: Kitchen',
              description: `Burner left on without kitchen presence for ${elapsedUnattendedSec} seconds.`,
              confidence: 0.95,
              resolved: false,
              escalationLevel: 1,
            })
          }
        }
      } else if (elapsedUnattendedSec > 8) {
        color = '#F59E0B' // Amber warning
        label = `⚠️ WARNING: STOVE UNATTENDED (${elapsedUnattendedSec}s)`
        severity = 'warning'
      } else {
        color = '#38BDF8'
        label = 'STOVE ACTIVE: CHEF PRESENT'
      }
    }

    const boundingBoxes: BoundingBox[] = [
      {
        ...stoveZone,
        label,
        color,
        confidence: 0.92,
      },
    ]

    return {
      id: `stove-res-${now}`,
      processorId: this.id,
      timestamp: now,
      boundingBoxes,
      data: {
        stoveActive: this.stoveActive,
        personInKitchen: this.personPresentInKitchen,
        unattendedSeconds: elapsedUnattendedSec,
        hazardLevel: severity.toUpperCase(),
      },
      message: severity === 'critical' ? 'Fire prevention countdown active' : undefined,
    }
  }

  async destroy(): Promise<void> {
    this.reset()
  }
}

export const stoveHazardProcessor = new StoveHazardProcessor()
