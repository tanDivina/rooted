'use client'

import { useState, useRef, useCallback, useEffect, RefObject } from 'react'

interface UseWebRTCStreamOptions {
  videoRef: RefObject<HTMLVideoElement>
  deviceId?: string
}

interface UseWebRTCStreamReturn {
  streamActive: boolean
  // True once frames are actually arriving, not just when the track is negotiated
  receiving: boolean
  streamError: string | null
  startStream: () => Promise<void>
  stopStream: () => Promise<void>
}

/**
 * Manages WebRTC connection to Ring camera stream.
 * Handles ICE gathering, SDP negotiation, and cleanup.
 */
export function useWebRTCStream({ videoRef, deviceId }: UseWebRTCStreamOptions): UseWebRTCStreamReturn {
  const [streamActive, setStreamActive] = useState(false)
  const [receiving, setReceiving] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const sessionUrlRef = useRef<string | null>(null)

  // Close the peer connection and the Ring session behind it, so the device isn't left streaming
  const endSession = useCallback((pc: RTCPeerConnection | null) => {
    pc?.close()
    if (pcRef.current === pc) pcRef.current = null
    if (sessionUrlRef.current) {
      fetch('/api/ring/stream', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionUrl: sessionUrlRef.current }),
        keepalive: true,
      }).catch(() => {})
      sessionUrlRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setStreamActive(false)
    setReceiving(false)
  }, [videoRef])

  const startStream = useCallback(async () => {
    setStreamError(null)
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      })
      endSession(pcRef.current)
      pcRef.current = pc

      pc.addTransceiver('audio', { direction: 'sendrecv' })
      pc.addTransceiver('video', { direction: 'recvonly' })

      pc.ontrack = (e) => {
        if (videoRef.current && e.streams[0]) {
          const video = videoRef.current
          video.srcObject = e.streams[0]
          video.onplaying = () => setReceiving(true)
          video.play().catch(() => {})
          setStreamActive(true)
        }
      }

      // Ring ends a live view after about a minute, and a session can drop: say so instead of
      // leaving a black "live" view up
      pc.onconnectionstatechange = () => {
        if (pcRef.current !== pc) return
        const ended = () => {
          if (pcRef.current !== pc) return
          endSession(pc)
          setStreamError('The Ring live view ended. Start it again to keep watching.')
        }
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') ended()
        // "disconnected" can recover on its own; give it a few seconds
        if (pc.connectionState === 'disconnected') {
          setTimeout(() => pc.connectionState === 'disconnected' && ended(), 4000)
        }
      }

      const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true })
      await pc.setLocalDescription(offer)

      // Wait for ICE gathering
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === 'complete') return resolve()
        const timeout = setTimeout(() => resolve(), 3000)
        pc.onicegatheringstatechange = () => {
          if (pc.iceGatheringState === 'complete') {
            clearTimeout(timeout)
            resolve()
          }
        }
      })

      const res = await fetch('/api/ring/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sdpOffer: pc.localDescription!.sdp, deviceId }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Stream start failed')
      }

      const { sdpAnswer, sessionUrl } = await res.json()
      sessionUrlRef.current = sessionUrl
      await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer })

      // Ring accepted the session but no frames came: don't leave a black view labelled live
      setTimeout(() => {
        if (pcRef.current === pc && !(videoRef.current && videoRef.current.videoWidth > 0)) {
          endSession(pc)
          setStreamError('Ring answered, but no video arrived. Try starting the live view again.')
        }
      }, 15000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stream failed'
      console.error('Stream error:', err)
      setStreamError(message)
      setStreamActive(false)
    }
  }, [videoRef, deviceId, endSession])

  const stopStream = useCallback(async () => {
    endSession(pcRef.current)
    setStreamError(null)
  }, [endSession])

  // Leaving the page ends the Ring session too
  useEffect(() => {
    const onHide = () => endSession(pcRef.current)
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('pagehide', onHide)
      onHide()
    }
  }, [endSession])

  return { streamActive, receiving, streamError, startStream, stopStream }
}
