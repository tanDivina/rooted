import { VideoProcessor, ProcessorResult } from '../types'

const SAMPLE_RATE = 16000        // what Whisper expects
const WINDOW_SEC = 3             // each transcription looks at the last 3 seconds...
const HOP_MS = 1500              // ...every 1.5 seconds, so a call is never split badly twice
const SPEECH_RMS = 0.01          // never transcribe anything quieter than this
const ABOVE_ROOM = 2.5            // speech is this many times louder than the room's own background
const COOLDOWN_MS = 20000        // one alert per call for help, not one per window
// The language spoken at home. Whisper needs it named: left to itself, transformers.js assumes
// English and hears "¡Ayuda!" as English words. One language keeps it to one pass per window;
// two passes were too slow on a laptop CPU. English is tested; Spanish ('es') is not yet.
const LANGUAGES = [process.env.NEXT_PUBLIC_LISTEN_LANGUAGE || 'en']

// Matched against a lower-cased transcript with accents and punctuation removed
const DISTRESS = [
  'help', 'i fell', 'i have fallen', 'cant get up', 'can not get up', 'cannot get up', 'call 911', 'ambulance',
  'ayuda', 'auxilio', 'socorro', 'me cai', 'no me puedo levantar',
]

const normalise = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()

/**
 * Call-for-help listener.
 *
 * Taps the audio of whatever the camera view is playing (a Ring stream's audio track, or a
 * demo clip) and runs Whisper on-device in a Web Worker, listening for calls like “Help!”,
 * “I can’t get up” or “¡Ayuda!”. No audio leaves the browser.
 */
export class VoiceDistressProcessor implements VideoProcessor {
  id = 'care-voice-distress'
  name = 'Call-for-help listener'
  description = 'Listens for calls like "Help!", "I fell!" or "¡Ayuda!"'
  enabled = true

  private worker: Worker | null = null
  private workerReady = false
  private ctx: AudioContext | null = null
  private tapped = new WeakMap<object, AudioNode>()
  private ring = new Float32Array(SAMPLE_RATE * WINDOW_SEC)
  private ringPos = 0
  private filled = 0
  private hop: ReturnType<typeof setInterval> | null = null
  private busy = false
  private roomRms = 0
  private seq = 0
  private lastHeard = ''
  private lastPhrase: string | null = null
  private lastDetectionTime = 0
  private onIncidentCallback?: (incident: any) => void

  constructor(onIncident?: (incident: any) => void) {
    this.onIncidentCallback = onIncident
  }

  setIncidentCallback(cb: (incident: any) => void) {
    this.onIncidentCallback = cb
  }

  /** Whether the speech model has loaded. */
  get ready(): boolean {
    return this.workerReady
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined' || this.worker) return
    this.worker = new Worker(new URL('./whisper.worker.ts', import.meta.url), { type: 'module' })
    this.worker.onmessage = (e: MessageEvent<{ ready?: boolean; text?: string; error?: string }>) => {
      if (e.data.ready) this.workerReady = true
      if (e.data.error) console.warn('[VoiceDistress]', e.data.error)
      if (e.data.text != null) {
        this.workerReady = true
        this.busy = false
        this.lastHeard = e.data.text.trim()
        this.evaluateTranscript(e.data.text)
      }
    }
    this.worker.postMessage({ id: this.seq++, warmup: true })
  }

  /**
   * Start listening to a video element's sound. Call it from a click (browsers only start
   * audio after a user gesture). A Ring stream is tapped from its audio track; a clip is
   * routed through Web Audio and unmuted, so the people watching hear it too.
   */
  listenTo(video: HTMLVideoElement) {
    if (typeof window === 'undefined') return
    this.init()
    this.ctx ??= new AudioContext({ sampleRate: SAMPLE_RATE })
    this.ctx.resume().catch(() => {})

    const stream = video.srcObject instanceof MediaStream ? video.srcObject : null
    const key: object = stream ?? video
    if (!this.tapped.has(key)) {
      let source: AudioNode
      if (stream) {
        if (stream.getAudioTracks().length === 0) return
        source = this.ctx.createMediaStreamSource(stream)
      } else {
        source = this.ctx.createMediaElementSource(video) // only allowed once per element
        source.connect(this.ctx.destination)
      }
      const tap = this.ctx.createScriptProcessor(4096, 1, 1)
      tap.onaudioprocess = (ev) => this.push(ev.inputBuffer.getChannelData(0))
      source.connect(tap)
      tap.connect(this.ctx.destination) // a ScriptProcessor only runs while connected; it outputs silence
      this.tapped.set(key, source)
    }
    if (!stream) video.muted = false

    this.ring.fill(0)
    this.filled = 0
    this.roomRms = 0
    this.hop ??= setInterval(() => this.transcribe(), HOP_MS)
  }

  private push(samples: Float32Array) {
    for (let i = 0; i < samples.length; i++) {
      this.ring[this.ringPos] = samples[i]
      this.ringPos = (this.ringPos + 1) % this.ring.length
    }
    this.filled = Math.min(this.ring.length, this.filled + samples.length)
  }

  private transcribe() {
    if (!this.worker || this.busy || this.filled < SAMPLE_RATE) return
    const n = this.filled
    const audio = new Float32Array(n)
    for (let i = 0; i < n; i++) audio[i] = this.ring[(this.ringPos - n + i + this.ring.length) % this.ring.length]
    // Loudness of the newest 0.5 s, against a slowly learned background level (clock, fridge, TV hum)
    const recent = audio.subarray(n - SAMPLE_RATE / 2)
    const rms = Math.sqrt(recent.reduce((s, x) => s + x * x, 0) / recent.length)
    this.roomRms = this.roomRms === 0 ? rms : Math.min(rms, this.roomRms * 0.9 + rms * 0.1)
    if (rms < SPEECH_RMS || rms < this.roomRms * ABOVE_ROOM) return
    this.busy = true
    this.worker.postMessage({ id: this.seq++, audio, languages: LANGUAGES }, [audio.buffer])
  }

  private evaluateTranscript(text: string) {
    const heard = normalise(text)
    const matched = DISTRESS.find((w) => heard.includes(w))
    const now = Date.now()
    if (!matched || now - this.lastDetectionTime < COOLDOWN_MS) return
    this.lastDetectionTime = now
    // Quote the language that matched, not both transcripts
    this.lastPhrase = text.split(' / ').find((t) => normalise(t).includes(matched))?.trim() ?? text.trim()
    this.onIncidentCallback?.({
      id: `voice-${now}`,
      type: 'voice_distress',
      severity: 'critical',
      timestamp: now,
      title: 'A call for help',
      description: `Heard “${this.lastPhrase}” on the camera’s audio.`,
      confidence: 0.9,
      resolved: false,
      escalationLevel: 1,
    })
  }

  /** Stands in for the listener when the speech model can’t load (offline, for example). */
  triggerSimulatedDistress(phrase = 'Help me, I can’t get up!') {
    const now = Date.now()
    this.lastPhrase = phrase
    this.lastDetectionTime = now
    this.onIncidentCallback?.({
      id: `voice-${now}`,
      type: 'voice_distress',
      severity: 'critical',
      timestamp: now,
      title: 'A call for help',
      description: `Heard “${phrase}” on the camera’s audio.`,
      confidence: 0.9,
      resolved: false,
      escalationLevel: 1,
    })
  }

  reset() {
    this.lastDetectionTime = 0
    this.lastPhrase = null
    this.lastHeard = ''
  }

  async process(
    frame: ImageData,
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement
  ): Promise<ProcessorResult | null> {
    const now = Date.now()
    const active = now - this.lastDetectionTime < 8000
    return {
      id: `voice-res-${now}`,
      processorId: this.id,
      timestamp: now,
      data: {
        status: active ? 'Call for help heard' : this.hop ? 'Listening' : 'Not listening',
        lastHeard: this.lastHeard || '…',
        engine: this.workerReady ? 'Whisper (on-device)' : 'Loading speech model',
      },
      message: active ? `Heard: “${this.lastPhrase}”` : undefined,
    }
  }

  async destroy(): Promise<void> {
    if (this.hop) clearInterval(this.hop)
    this.hop = null
    this.worker?.terminate()
    this.worker = null
    this.workerReady = false
    await this.ctx?.close().catch(() => {})
    this.ctx = null
    this.tapped = new WeakMap()
  }
}

export const voiceDistressProcessor = new VoiceDistressProcessor()
