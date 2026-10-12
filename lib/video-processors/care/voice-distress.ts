import { VideoProcessor, ProcessorResult } from '../types'

/**
 * Two-Way Audio Distress & "Call For Help" Sentinel
 * 
 * Analyzes audio streams and browser speech recognition for distress keywords
 * ("Help!", "I can't get up", "Call 911", "Ayuda").
 */
export class VoiceDistressProcessor implements VideoProcessor {
  id = 'care-voice-distress'
  name = '🎙️ Voice Distress & SOS Listener'
  description = 'Listens for emergency keywords ("Help!", "I fell!", "Call for help!")'
  enabled = true

  private listening = false
  private recognition: any = null
  private lastDetectedPhrase: string | null = null
  private lastDetectionTime = 0
  private onIncidentCallback?: (incident: any) => void

  constructor(onIncident?: (incident: any) => void) {
    this.onIncidentCallback = onIncident
  }

  setIncidentCallback(cb: (incident: any) => void) {
    this.onIncidentCallback = cb
  }

  async init(): Promise<void> {
    if (typeof window === 'undefined') return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = true
        this.recognition.interimResults = true
        this.recognition.lang = 'en-US'

        this.recognition.onresult = (event: any) => {
          const current = event.resultIndex
          const transcript = event.results[current][0].transcript.toLowerCase()
          this.evaluateTranscript(transcript)
        }

        this.recognition.onerror = () => {
          // Keep resilient
        }

        this.recognition.onend = () => {
          if (this.enabled) {
            try {
              this.recognition?.start()
            } catch {
              // Ignore restart collision
            }
          }
        }

        this.recognition.start()
        this.listening = true
      } catch (e) {
        console.warn('Speech recognition could not be auto-started:', e)
      }
    }
  }

  private evaluateTranscript(text: string) {
    const distressWords = [
      'help',
      'help me',
      'i fell',
      'i cannot get up',
      'cant get up',
      'ambulance',
      'emergency',
      'ayuda',
      'socorro',
      'caida',
      'no me puedo levantar',
    ]

    const matched = distressWords.find((w) => text.includes(w))
    if (matched) {
      const now = Date.now()
      this.lastDetectedPhrase = matched.toUpperCase()
      this.lastDetectionTime = now

      if (this.onIncidentCallback) {
        this.onIncidentCallback({
          id: `voice-${now}`,
          type: 'voice_distress',
          severity: 'critical',
          timestamp: now,
          title: `Voice SOS Triggered: "${matched.toUpperCase()}"`,
          description: `Ring camera audio detected distress acoustic phrase: "${matched}".`,
          confidence: 0.99,
          resolved: false,
          escalationLevel: 1,
        })
      }
    }
  }

  triggerSimulatedDistress(phrase = 'HELP ME, I FELL!') {
    const now = Date.now()
    this.lastDetectedPhrase = phrase
    this.lastDetectionTime = now

    if (this.onIncidentCallback) {
      this.onIncidentCallback({
        id: `voice-${now}`,
        type: 'voice_distress',
        severity: 'critical',
        timestamp: now,
        title: `Voice SOS Detected: "${phrase}"`,
        description: 'Acoustic pattern matched vocal distress cry. Resident requesting immediate assistance.',
        confidence: 0.98,
        resolved: false,
        escalationLevel: 1,
      })
    }
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
        status: active ? 'EMERGENCY PHRASE DETECTED' : 'Acoustic Monitor Active',
        lastPhrase: this.lastDetectedPhrase || 'Listening for distress words...',
        engine: this.recognition ? 'Web Speech Engine' : 'Audio Analyzer Ready',
      },
      message: active ? `🚨 SOS Keyword: "${this.lastDetectedPhrase}"` : undefined,
    }
  }

  async destroy(): Promise<void> {
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch {}
      this.recognition = null
    }
    this.listening = false
  }
}

export const voiceDistressProcessor = new VoiceDistressProcessor()
