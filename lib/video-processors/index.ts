/**
 * Video Processor Plugin System
 */

export * from './types'
export { processorRegistry } from './registry'

// Register built-in caretaking processors
import { fallDetectionProcessor } from './care/fall-detection'
import { stoveHazardProcessor } from './care/stove-hazard'
import { voiceDistressProcessor } from './care/voice-distress'
import { failSafeSentinelProcessor } from './care/failsafe-sentinel'

// Register built-in example processors
import { motionHeatmapProcessor } from './examples/motion-heatmap'
import { brightnessAnalyzerProcessor } from './examples/brightness-analyzer'
import { amazonLogoGame } from './examples/amazon-logo-game'
import { processorRegistry } from './registry'

// Auto-register caretaking processors (enabled by default)
processorRegistry.register(fallDetectionProcessor)
processorRegistry.register(stoveHazardProcessor)
processorRegistry.register(voiceDistressProcessor)
processorRegistry.register(failSafeSentinelProcessor)

// Auto-register utility/demo processors (disabled by default)
processorRegistry.register(motionHeatmapProcessor)
processorRegistry.register(brightnessAnalyzerProcessor)
processorRegistry.register(amazonLogoGame)
