import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET all food types
export async function GET() {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const foods = await prisma.foodType.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(foods)
  } catch (error) {
    console.error('Get food types error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST create food type (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = await req.json()
    const food = await prisma.foodType.create({ data })
    return NextResponse.json(food)
  } catch (error) {
    console.error('Create food type error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
