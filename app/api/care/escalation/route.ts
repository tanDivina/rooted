import { NextRequest, NextResponse } from 'next/server'
import { writeBrief, notifyFamily, updateFor } from '@/lib/care/outreach'

// Step 2 contacts the family for real (SNS text, SES email) when those are configured.
// Step 3, the 911 dispatch, is always simulated: a hackathon app must never call emergency services.
export async function POST(req: NextRequest) {
  try {
    const { incident, incidentId, level, action, unansweredSeconds, update } = await req.json()
    const log: Record<string, any> = { incidentId: incident?.id ?? incidentId, level, action, timestamp: Date.now() }

    if (action === 'FAMILY_UPDATE' && incident && update) {
      log.family = await notifyFamily(updateFor(incident, update))
    } else if (level === 2 && incident) {
      const brief = await writeBrief(incident, unansweredSeconds ?? 15)
      log.brief = brief
      log.family = await notifyFamily(brief)
    }
    if (level >= 3) {
      log.dispatch = 'SIMULATED (Rooted never calls emergency services)'
    }

    console.log('[escalation]', JSON.stringify({ ...log, brief: log.brief && { source: log.brief.source } }))
    return NextResponse.json({ success: true, log })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
