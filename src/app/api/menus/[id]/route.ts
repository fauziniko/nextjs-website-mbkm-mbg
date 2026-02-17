import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

// GET single menu
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const menu = await prisma.menu.findUnique({
      where: { id },
      include: { menuFoods: { include: { food: true } } },
    })

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    return NextResponse.json(menu)
  } catch (error) {
    console.error('Get menu error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// PUT update menu
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { name, description, imageUrl, detectedImageUrl, foods } = await req.json()

    // Delete existing menu foods and recreate
    await prisma.menuFood.deleteMany({ where: { menuId: id } })

    const menu = await prisma.menu.update({
      where: { id },
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
      include: { menuFoods: { include: { food: true } } },
    })

    // Recalculate totals (using Large portion as default)
    let totalEnergy = 0, totalProtein = 0, totalFat = 0, totalFiber = 0, totalCarbohydrate = 0
    for (const mf of menu.menuFoods) {
      totalEnergy += mf.food.energyLarge * mf.quantity
      totalProtein += mf.food.proteinLarge * mf.quantity
      totalFat += mf.food.fatLarge * mf.quantity
      totalFiber += mf.food.fiberLarge * mf.quantity
      totalCarbohydrate += mf.food.carbohydrateLarge * mf.quantity
    }

    const updated = await prisma.menu.update({
      where: { id },
      data: { totalEnergy, totalProtein, totalFat, totalFiber, totalCarbohydrate },
      include: { menuFoods: { include: { food: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update menu error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE menu
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await prisma.menu.delete({ where: { id } })
    return NextResponse.json({ message: 'Menu deleted' })
  } catch (error) {
    console.error('Delete menu error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
