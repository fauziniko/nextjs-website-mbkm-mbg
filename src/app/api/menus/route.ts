import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET all menus with foods
export async function GET() {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const menus = await prisma.menu.findMany({
      include: {
        menuFoods: {
          include: { food: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(menus)
  } catch (error) {
    console.error('Get menus error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST create menu (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, description, imageUrl, detectedImageUrl, foods, foodImages } = await req.json()

    // Update FoodType images if provided (from daily-menu import)
    if (foodImages && Array.isArray(foodImages)) {
      for (const fi of foodImages as { foodId: string; imageUrl: string }[]) {
        if (fi.foodId && fi.imageUrl) {
          const existing = await prisma.foodType.findUnique({ where: { id: fi.foodId } })
          if (existing && !existing.imageUrl) {
            await prisma.foodType.update({
              where: { id: fi.foodId },
              data: { imageUrl: fi.imageUrl },
            })
          }
        }
      }
    }

    const menu = await prisma.menu.create({
      data: {
        name,
        description,
        imageUrl,
        detectedImageUrl,
        menuFoods: {
          create: foods?.map((f: { foodId: string; quantity: number }) => ({
            foodId: f.foodId,
            quantity: f.quantity || 1,
          })) || [],
        },
      },
      include: {
        menuFoods: { include: { food: true } },
      },
    })

    // Calculate total nutrition (using Large portion as default)
    let totalEnergy = 0, totalProtein = 0, totalFat = 0, totalFiber = 0, totalCarbohydrate = 0
    for (const mf of menu.menuFoods) {
      totalEnergy += mf.food.energyLarge * mf.quantity
      totalProtein += mf.food.proteinLarge * mf.quantity
      totalFat += mf.food.fatLarge * mf.quantity
      totalFiber += mf.food.fiberLarge * mf.quantity
      totalCarbohydrate += mf.food.carbohydrateLarge * mf.quantity
    }

    const updated = await prisma.menu.update({
      where: { id: menu.id },
      data: { totalEnergy, totalProtein, totalFat, totalFiber, totalCarbohydrate },
      include: { menuFoods: { include: { food: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Create menu error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
