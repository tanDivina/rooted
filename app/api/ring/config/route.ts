import { NextRequest, NextResponse } from 'next/server'
import { getAuthMode, setRuntimeToken } from '@/lib/auth'

export async function GET() {
  const mode = getAuthMode()

  if (mode === null && process.env.RING_ACCESS_TOKEN && process.env.RING_REFRESH_TOKEN) {
    return NextResponse.json(
      { error: 'Both RING_ACCESS_TOKEN and RING_REFRESH_TOKEN are set. Please use only one.' },
      { status: 400 }
    )
  }

  if (mode === null) {
    return NextResponse.json(
      { error: 'Authentication not configured. Set RING_ACCESS_TOKEN or RING_REFRESH_TOKEN in .env.local' },
      { status: 400 }
    )
  }

  return NextResponse.json({ mode })
}

// The dashboard's "Connect a Ring camera" box: use a pasted Playground token for this server run
export async function POST(request: NextRequest) {
  const { token } = await request.json().catch(() => ({}))
  if (typeof token !== 'string' || !/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(token.trim())) {
    return NextResponse.json({ error: 'That doesn’t look like a Ring token (it should start with eyJ).' }, { status: 400 })
  }
  setRuntimeToken(token.trim())
  return NextResponse.json({ mode: 'access_token' })
}
