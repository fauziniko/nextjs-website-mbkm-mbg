import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET all daily menus for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const userId = session.user.role === 'ADMIN' 
      ? searchParams.get('userId') || session.user.id
      : session.user.id

    const where: Record<string, unknown> = { userId }
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }

    const dailyMenus = await prisma.dailyMenu.findMany({
      where,
      include: {
        menu: {
          include: { menuFoods: { include: { food: true } } },
        },
        dailyMenuFoods: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(dailyMenus)
  } catch (error) {
    console.error('Get daily menus error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST create daily menu
export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session) {
      console.error('[DAILY-MENUS POST] No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('[DAILY-MENUS POST] Session user:', session.user.id, session.user.email)

    const body = await req.json()
    const { menuId, date, notes, originalImageUrl, detectedImageUrl, foods } = body
    console.log('[DAILY-MENUS POST] menuId:', menuId, 'foods:', foods?.length, 'originalImageUrl:', !!originalImageUrl, 'detectedImageUrl:', !!detectedImageUrl)

    const dailyMenu = await prisma.dailyMenu.create({
      data: {
        userId: session.user.id,
        ...(menuId ? { menuId } : {}),
        date: date ? new Date(date) : new Date(),
        notes,
        originalImageUrl,
        detectedImageUrl,
        dailyMenuFoods: {
          create: foods?.map((f: {
            foodName: string; quantity: number; confidence: number; trayClass: string;
            foodImageUrl: string;
            energy: number; protein: number; fat: number; fiber: number; carbohydrate: number;
            energySmall: number; proteinSmall: number; fatSmall: number; fiberSmall: number; carbohydrateSmall: number;
          }) => ({
            foodName: f.foodName,
            quantity: f.quantity || 1,
            confidence: f.confidence || 0,
            trayClass: f.trayClass || null,
            foodImageUrl: f.foodImageUrl || null,
            energy: f.energy || 0,
            protein: f.protein || 0,
            fat: f.fat || 0,
            fiber: f.fiber || 0,
            carbohydrate: f.carbohydrate || 0,
            energySmall: f.energySmall || 0,
            proteinSmall: f.proteinSmall || 0,
            fatSmall: f.fatSmall || 0,
            fiberSmall: f.fiberSmall || 0,
            carbohydrateSmall: f.carbohydrateSmall || 0,
          })) || [],
        },
      },
      include: {
        menu: { include: { menuFoods: { include: { food: true } } } },
        dailyMenuFoods: true,
      },
    })

    return NextResponse.json(dailyMenu)
  } catch (error) {
    console.error('Create daily menu error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: 'Server error', details: message }, { status: 500 })
  }
}
