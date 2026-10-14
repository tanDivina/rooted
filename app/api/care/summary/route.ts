import { NextRequest, NextResponse } from 'next/server'
import { writeBrief } from '@/lib/care/outreach'

// The paramedic brief shown in Growth rings: written by Claude on Bedrock from the
// incident record, or an honest template when AWS isn't configured.
export async function POST(req: NextRequest) {
  try {
    const { incident } = await req.json()
    if (!incident) {
      return NextResponse.json({ error: 'Incident missing' }, { status: 400 })
    }
    const brief = await writeBrief(incident)
    return NextResponse.json({ summary: brief.paramedicBrief, source: brief.source })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to write the brief' }, { status: 500 })
  }
}
