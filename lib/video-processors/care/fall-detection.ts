import { VideoProcessor, ProcessorResult, BoundingBox } from '../types'
import type { PoseLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision'

type Posture = 'absent' | 'standing' | 'sitting' | 'lying' | 'horizontal_floor' | 'fall_detected'

export interface FallDetectionData {
  posture: Posture
  confidence: number
  immobilitySeconds: number
  torsoAngle: number
  hipY: number
  lastFallTimestamp: number | null
}

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task'

// Landmark indices (MediaPipe Pose)
const NOSE = 0, L_SHOULDER = 11, R_SHOULDER = 12, L_HIP = 23, R_HIP = 24, L_ANKLE = 27, R_ANKLE = 28
const TRACKED = [0, 11, 12, 23, 24, 25, 26, 27, 28]

// Tuning. Distances are relative to the person's own standing height (nose to ankles),
// so the same rules hold whether they are close to the camera or across the room.
const DROP_FRACTION = 0.33     // hips dropping a third of standing height...
const DROP_FRAME = 0.2        // until a standing height is known (never seen upright, in full): drop of the frame height
const DROP_WITHIN_MS = 1500    // ...within this long is sudden (tipping over without a drop, as onto a sofa, is not)
const FLOOR_GAP = 0.25         // hips within a quarter of standing height of the ankles: on the floor
const SEATED_GAP = 0.4         // upright torso with hips this close to the ankles: sitting
                               // (also how far up a body already on the floor may rise and still count as down)
const LEGS_STRAIGHT = 0.4      // hips at least this far above the ankles: standing, so height can be learned
const HIPS_STEADY = 0.05      // hips moving less than this (of standing height) over 0.5s: not sitting down or falling
const ABOVE_SEAT = 0.1         // lying with hips this far above where they last sat: on furniture, not the floor
const DROP_WINDOW_MS = 3000    // a sudden drop counts if it happened this recently
const STILL_MOVEMENT = 0.03    // smoothed mean landmark movement over ~1s below this is "still"
                               // (pose landmarks jitter ~0.005-0.016 even on a frozen frame)
const FALL_STILL_SEC = 4       // still on the floor this long after a sudden drop: a fall
const LYING_STILL_SEC = 60     // still on the floor this long without a drop: also worth asking

interface Sample { t: number; hipY: number; pts: { x: number; y: number }[] }

/**
 * Fall & Slip Detection Processor for Ring Cameras
 *
 * Runs MediaPipe Pose Landmarker in the browser on each frame of the Ring stream.
 * A fall is a sudden drop of the hips with the torso tipping toward horizontal,
 * followed by stillness near the floor. Lying down slowly is treated as resting,
 * and only raises a (gentler) alert after a minute of stillness on the floor.
 */
export class FallDetectionProcessor implements VideoProcessor {
  id = 'care-fall-detection'
  name = 'Fall & slip watch'
  description = 'Notices sudden falls, slips and stillness on the floor'
  enabled = true

  private landmarker: PoseLandmarker | null = null
  private loading: Promise<void> | null = null
  private lastTs = 0

  private posture: Posture = 'absent'
  private history: Sample[] = []
  private standingHeight: number | null = null
  private seatedHipY: number | null = null
  private lastDropAt = 0
  private downSince: number | null = null
  private stillSince: number | null = null
  private movementEma = 0
  private fallTriggered = false
  private lastFallTimestamp: number | null = null
  private lastSeenAt = 0
  private onIncidentCallback?: (incident: any) => void

  constructor(onIncident?: (incident: any) => void) {
    this.onIncidentCallback = onIncident
  }

  /** Whether a person was seen in the last couple of seconds (used by the stove watch). */
  get personPresent(): boolean {
    return Date.now() - this.lastSeenAt < 2000
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined' || this.landmarker) return
    if (!this.loading) {
      this.loading = (async () => {
        const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL)
        const options = (delegate: 'GPU' | 'CPU') => ({
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'VIDEO' as const,
          numPoses: 1,
        })
        try {
          this.landmarker = await PoseLandmarker.createFromOptions(fileset, options('GPU'))
        } catch {
          this.landmarker = await PoseLandmarker.createFromOptions(fileset, options('CPU'))
        }
      })().catch((err) => {
        console.error('[FallDetection] Pose model failed to load:', err)
        this.loading = null
      })
    }
    await this.loading
  }

  setIncidentCallback(cb: (incident: any) => void) {
    this.onIncidentCallback = cb
  }

  /**
   * Simulate a fall trigger directly for testing or scenario demo
   */
  triggerSimulatedFall() {
    this.posture = 'fall_detected'
    this.fallTriggered = true
    this.lastFallTimestamp = Date.now()
    this.raise('A fall in the living room', 'Went down to the floor and hasn’t moved for more than 4 seconds.', 0.96)
  }

  reset() {
    this.posture = 'absent'
    this.history = []
    this.standingHeight = null
    this.seatedHipY = null
    this.lastDropAt = 0
    this.downSince = null
    this.stillSince = null
    this.movementEma = 0
    this.fallTriggered = false
  }

  private raise(title: string, description: string, confidence: number) {
    this.onIncidentCallback?.({
      id: `fall-${Date.now()}`,
      type: 'fall_detected',
      severity: 'critical',
      timestamp: Date.now(),
      title,
      description,
      confidence,
      resolved: false,
      escalationLevel: 1,
    })
  }

  async process(
    frame: ImageData,
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement
  ): Promise<ProcessorResult | null> {
    const now = Date.now()
    if (!this.landmarker) {
      if (!this.loading) this.init()
      return null
    }
    if (video.readyState < 2) return null

    // detectForVideo needs strictly increasing timestamps
    const ts = Math.max(performance.now(), this.lastTs + 1)
    this.lastTs = ts
    const result = this.landmarker.detectForVideo(video, ts)
    const lm: NormalizedLandmark[] | undefined = result.landmarks?.[0]

    const { width, height } = frame

    if (!lm) {
      // Pose models often lose a body lying on the floor. If the person went down suddenly
      // and then vanished in place, nobody saw them get up: treat that as stillness.
      if (this.posture === 'horizontal_floor' && this.downSince) {
        const lostSec = Math.floor((now - (this.stillSince ?? this.downSince)) / 1000)
        if (lostSec >= FALL_STILL_SEC + 1) {
          this.fallTriggered = true
          this.posture = 'fall_detected'
          this.lastFallTimestamp = now
          this.raise(
            'A fall in the living room',
            `Went down suddenly and hasn’t been seen moving for ${lostSec} seconds.`,
            0.85
          )
        }
        return this.result(now, [], `On the floor · ${lostSec}s`, lostSec)
      }
      if (!this.downSince) this.posture = 'absent'
      return this.result(now, [], 'Nobody in view', 0)
    }
    this.lastSeenAt = now

    const mid = (a: number, b: number) => ({ x: (lm[a].x + lm[b].x) / 2, y: (lm[a].y + lm[b].y) / 2 })
    const shoulders = mid(L_SHOULDER, R_SHOULDER)
    const hips = mid(L_HIP, R_HIP)
    // 0° = upright, 90° = lying flat
    const torsoAngle =
      (Math.atan2(Math.abs(hips.x - shoulders.x) * (width / height), Math.abs(hips.y - shoulders.y)) * 180) / Math.PI

    const visible = lm.filter((p) => (p.visibility ?? 1) > 0.5)
    const xs = visible.map((p) => p.x), ys = visible.map((p) => p.y)
    const box = {
      x: Math.min(...xs) * width,
      y: Math.min(...ys) * height,
      width: (Math.max(...xs) - Math.min(...xs)) * width,
      height: (Math.max(...ys) - Math.min(...ys)) * height,
    }

    // History for drop speed and stillness
    this.history.push({ t: now, hipY: hips.y, pts: TRACKED.map((i) => ({ x: lm[i].x, y: lm[i].y })) })
    this.history = this.history.filter((s) => now - s.t <= 3000)
    const ago = (ms: number) => this.history.find((s) => now - s.t <= ms) ?? this.history[0]

    const oneSecAgo = ago(1000)

    // Learn the person's standing height while they are clearly upright, legs straight and fully in view
    // (an upright torso alone is not enough: sitting would shrink it)
    const ankles = mid(L_ANKLE, R_ANKLE)
    const anklesSeen = Math.min(lm[L_ANKLE].visibility ?? 1, lm[R_ANKLE].visibility ?? 1) > 0.5
    if (torsoAngle < 20 && anklesSeen) {
      const h = ankles.y - lm[NOSE].y
      // ...and hips not on their way down (lowering into a chair looks upright with straight-ish legs)
      const halfSecAgo = ago(500)
      const steady = Math.abs(hips.y - halfSecAgo.hipY) < HIPS_STEADY * h
      if (h > 0.05 && ankles.y - hips.y > LEGS_STRAIGHT * Math.max(h, this.standingHeight ?? 0) && steady)
        this.standingHeight = this.standingHeight == null ? h : this.standingHeight * 0.9 + h * 0.1
    }
    const H = this.standingHeight

    const recent = this.history.filter((s) => now - s.t <= DROP_WITHIN_MS)
    const hipDrop = hips.y - Math.min(...recent.map((s) => s.hipY))
    if (hipDrop > (H ? DROP_FRACTION * H : DROP_FRAME)) this.lastDropAt = now

    const movement =
      oneSecAgo.pts.reduce((sum, p, i) => sum + Math.hypot(p.x - lm[TRACKED[i]].x, p.y - lm[TRACKED[i]].y), 0) /
      TRACKED.length
    this.movementEma = this.movementEma * 0.6 + movement * 0.4
    const still = this.movementEma < STILL_MOVEMENT
    if (!still) this.stillSince = null
    else if (!this.stillSince) this.stillSince = now
    const stillSec = this.stillSince ? Math.floor((now - this.stillSince) / 1000) : 0

    // On the floor: torso near flat and hips about level with the ankles. Once down, stay down
    // until clearly up again, so a pose hovering near a threshold doesn't flicker.
    const gap = ankles.y - hips.y
    const wasDown = this.downSince != null
    const lowered = H ? gap < (wasDown ? SEATED_GAP : FLOOR_GAP) * H : box.width > box.height * 1.2
    const down = torsoAngle > (wasDown ? 40 : 55) && lowered

    let label = 'Up and moving'
    let color = '#5C6B37' // moss
    let confidence = 0.9

    if (down) {
      if (!this.downSince) this.downSince = now
      const suddenly = now - this.lastDropAt < DROP_WINDOW_MS || this.posture === 'horizontal_floor'

      if (this.fallTriggered) {
        this.posture = 'fall_detected'
        label = `A fall · still for ${stillSec}s`
        color = '#A8432B'
        confidence = 0.95
      } else if (suddenly) {
        this.posture = 'horizontal_floor'
        label = `On the floor · ${stillSec}s`
        color = '#B7791F' // honey
        confidence = 0.85
        if (stillSec >= FALL_STILL_SEC) {
          this.fallTriggered = true
          this.posture = 'fall_detected'
          this.lastFallTimestamp = now
          label = `A fall · still for ${stillSec}s`
          color = '#A8432B'
          confidence = 0.95
          this.raise(
            'A fall in the living room',
            `Went down suddenly and hasn’t moved for ${stillSec} seconds.`,
            confidence
          )
        }
      } else {
        this.posture = 'lying'
        label = 'Lying down'
        color = '#6B5242' // bark
        confidence = 0.8
        // Hips still up at seat height (or higher): resting on a sofa or bed, not the floor
        const onFurniture = H != null && this.seatedHipY != null && hips.y < this.seatedHipY + ABOVE_SEAT * H
        if (stillSec >= LYING_STILL_SEC && !onFurniture) {
          this.fallTriggered = true
          this.posture = 'fall_detected'
          this.lastFallTimestamp = now
          label = `Still on the floor · ${stillSec}s`
          color = '#A8432B'
          this.raise(
            'Still on the floor',
            `Has been lying still low in the room for over a minute.`,
            0.8
          )
        }
      }
    } else {
      this.downSince = null
      if (this.posture === 'fall_detected' && torsoAngle > 35) {
        // Partly up but not upright yet: keep the alert state until they are clearly up
      } else {
        this.fallTriggered = false
        const seated = H != null && gap < SEATED_GAP * H && torsoAngle < 40
        if (seated) this.seatedHipY = hips.y
        this.posture = seated ? 'sitting' : 'standing'
        label = seated ? 'Sitting down' : 'Up and moving'
        color = seated ? '#6B5242' : '#5C6B37'
      }
    }

    // Only outline the person once something needs attention; a calm room stays clean
    const noticing = this.posture === 'fall_detected' || this.posture === 'horizontal_floor'
    const pad = 16
    const boxes: BoundingBox[] = noticing
      ? [{
          x: Math.max(0, box.x - pad),
          y: Math.max(0, box.y - pad),
          width: Math.min(width, box.width + pad * 2),
          height: Math.min(height, box.height + pad * 2),
          label,
          color,
          confidence,
        }]
      : []

    return this.result(now, boxes, label, stillSec, torsoAngle, hips.y, confidence)
  }

  private result(
    now: number,
    boundingBoxes: BoundingBox[],
    status: string,
    immobilitySeconds: number,
    torsoAngle = 0,
    hipY = 0,
    confidence = 0
  ): ProcessorResult {
    const data: FallDetectionData & { status: string } = {
      posture: this.posture,
      confidence,
      immobilitySeconds,
      torsoAngle: Math.round(torsoAngle),
      hipY: Number(hipY.toFixed(2)),
      lastFallTimestamp: this.lastFallTimestamp,
      status,
    }
    return {
      id: `fall-res-${now}`,
      processorId: this.id,
      timestamp: now,
      boundingBoxes,
      data,
      message: this.posture === 'fall_detected' ? 'Emergency countdown initiated' : undefined,
    }
  }

  async destroy(): Promise<void> {
    this.reset()
    this.landmarker?.close()
    this.landmarker = null
    this.loading = null
  }
}

export const fallDetectionProcessor = new FallDetectionProcessor()
