/// <reference lib="webworker" />
// On-device speech recognition for the call-for-help listener. Whisper (tiny, multilingual)
// runs in this worker through transformers.js, so audio never leaves the browser and the
// pose detector on the main thread keeps its frame rate.
import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers'

env.allowLocalModels = false

// Runs on the CPU (WebAssembly): about 3 to 5 seconds per 3-second window on a laptop.
// The WebGPU path hung in our tests, so it stays off until it can be verified.
let asr: Promise<AutomaticSpeechRecognitionPipeline> | null = null
const load = () =>
  (asr ??= pipeline('automatic-speech-recognition', 'onnx-community/whisper-tiny', {
    dtype: 'q8',
    device: 'wasm',
  }) as Promise<AutomaticSpeechRecognitionPipeline>)

self.onmessage = async (e: MessageEvent<{ id: number; audio?: Float32Array; warmup?: boolean; languages?: string[] }>) => {
  try {
    const transcriber = await load()
    if (e.data.warmup || !e.data.audio) {
      self.postMessage({ id: e.data.id, ready: true })
      return
    }
    // transformers.js falls back to English when no language is given, and hears "¡Ayuda!"
    // as English words, so transcribe once per language the household speaks.
    const texts: string[] = []
    for (const language of e.data.languages ?? ['en']) {
      const out = (await transcriber(e.data.audio, { task: 'transcribe', language })) as { text: string }
      texts.push(out.text.trim())
    }
    self.postMessage({ id: e.data.id, text: texts.join(' / ') })
  } catch (err) {
    self.postMessage({ id: e.data.id, error: String(err) })
  }
}
