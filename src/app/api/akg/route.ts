import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET all AKG thresholds
export async function GET() {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const thresholds = await prisma.akgThreshold.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(thresholds)
  } catch (error) {
    console.error('Get AKG thresholds error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST create AKG threshold (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await req.json()
    const threshold = await prisma.akgThreshold.create({ data })
    return NextResponse.json(threshold)
  } catch (error) {
    console.error('Create AKG threshold error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
