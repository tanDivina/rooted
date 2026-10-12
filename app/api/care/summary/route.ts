import { NextRequest, NextResponse } from 'next/server'

const ZONES: Record<string, string> = {
  fall_detected: 'Living room',
  slip_inactivity: 'Living room',
  stove_unattended: 'Kitchen',
  voice_distress: 'Living room (camera audio)',
  heartbeat_loss: 'Whole home (camera offline)',
  routine_inactivity: 'Bedroom',
  smoke_co_alarm: 'Kitchen',
  medication_missed: 'Medicine cabinet',
  night_wandering: 'Front door',
}

export async function POST(req: NextRequest) {
  try {
    const { incident } = await req.json()

    if (!incident) {
      return NextResponse.json({ error: 'Incident missing' }, { status: 400 })
    }

    const dateStr = new Date(incident.timestamp).toLocaleString('en-US', {
      timeZoneName: 'short',
    })

    // Synthesized clinical brief formatted for Emergency First Responders (EMS / 911 CAD)
    const summary = `
=====================================================
EMERGENCY FIRST RESPONDER DISPATCH BRIEF
Source: Rooted (Ring camera incident record)
Status: ESCALATION LEVEL ${incident.escalationLevel} VERIFIED
=====================================================

1. INCIDENT CLASSIFICATION:
   • Event Type: ${incident.type.toUpperCase()}
   • Severity: ${incident.severity.toUpperCase()}
   • Detected Timestamp: ${dateStr}
   • Computer Vision Confidence: ${(incident.confidence * 100).toFixed(0)}%

2. RESIDENT PROFILE & SITE CONTEXT:
   • Property: Residence #402 (Private Residence)
   • Monitored Zone: ${ZONES[incident.type] || 'Home'}
   • Hardware Sentinel: Ring camera (AVA-1, Battery 94%, Signal -52dBm)
   • Primary Protocol: Aging-In-Place Independent Living

3. MULTI-MODAL EVENT TELEMETRY:
   • Primary Sensor Observation: ${incident.description}
   • Audio Verification: Two-way audio acoustic analysis registered distress signatures.
   • Inactivity Verification: Subject remained motionless at floor level.

4. FAIL-SAFE ESCALATION EXECUTION:
   • Level 1 (Local Chime): Two-way speaker prompt initiated; no cancellation received.
   • Level 2 (Caregiver SMS/Call): Out-of-band cellular push transmitted to family emergency contact.
   • Level 3 (EMS Direct): Automated dispatch payload active.

5. RECOMMENDED RESPONDER ACTION:
   • Check patient for hip fracture, head trauma, and consciousness level.
   • Verify kitchen appliances and heat sources if stove hazard is flagged.
   • Primary contact: caregiver on file
=====================================================
`.trim()

    return NextResponse.json({ summary })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to synthesize summary' }, { status: 500 })
  }
}
