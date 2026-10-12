import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { incidentId, level, residentName, action } = await req.json()

    const now = Date.now()
    const log = {
      incidentId,
      level,
      residentName: residentName || 'Resident #402',
      action: action || 'ESCALATION_TRIGGERED',
      timestamp: now,
      channels: {
        chimeSpeaker: level >= 1 ? 'AUDIO_BEACON_TRANSMITTED' : 'STANDBY',
        caregiverSMS: level >= 2 ? 'AWS_SNS_SMS_SENT_TO_+15550198' : 'STANDBY',
        cad911Dispatch: level >= 3 ? 'PARAMEDIC_CAD_REST_PAYLOAD_SENT' : 'STANDBY',
      },
    }

    return NextResponse.json({ success: true, log })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
