import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/auth'

const API_BASE = 'https://api.amazonvision.com'

export async function GET(req: NextRequest) {
  try {
    let token: string | null = null
    try {
      token = await getAccessToken()
    } catch {
      // Token may be unconfigured in sandbox/demo mode
    }

    const deviceId = req.nextUrl.searchParams.get('deviceId') || process.env.NEXT_PUBLIC_RING_DEVICE_ID

    if (token && deviceId) {
      // Call Ring status endpoint
      const res = await fetch(`${API_BASE}/v1/devices/${deviceId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json({
          online: data?.data?.attributes?.online ?? true,
          liveRingResponse: true,
          timestamp: Date.now(),
        })
      }
    }

    // Return healthy mock heartbeat for simulation / playground mode
    return NextResponse.json({
      online: true,
      liveRingResponse: false,
      timestamp: Date.now(),
      battery: 94,
      rssi: -52,
    })
  } catch (err: any) {
    return NextResponse.json({ online: false, error: err.message }, { status: 500 })
  }
}
