import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { notes, foods } = await req.json()

    // Update daily menu foods
    if (foods) {
      await prisma.dailyMenuFood.deleteMany({ where: { dailyMenuId: id } })
      await prisma.dailyMenuFood.createMany({
        data: foods.map((f: { foodName: string; quantity: number; energy: number; protein: number; fat: number; carbohydrate: number }) => ({
          dailyMenuId: id,
          foodName: f.foodName,
          quantity: f.quantity || 1,
          energy: f.energy || 0,
          protein: f.protein || 0,
          fat: f.fat || 0,
          carbohydrate: f.carbohydrate || 0,
        })),
      })
    }

    // Calculate custom totals
    const updatedFoods = await prisma.dailyMenuFood.findMany({ where: { dailyMenuId: id } })
    const customEnergy = updatedFoods.reduce((sum, f) => sum + f.energy * f.quantity, 0)
    const customProtein = updatedFoods.reduce((sum, f) => sum + f.protein * f.quantity, 0)
    const customFat = updatedFoods.reduce((sum, f) => sum + f.fat * f.quantity, 0)
    const customCarbohydrate = updatedFoods.reduce((sum, f) => sum + f.carbohydrate * f.quantity, 0)

    const dailyMenu = await prisma.dailyMenu.update({
      where: { id },
      data: {
        notes,
        customEnergy,
        customProtein,
        customFat,
        customCarbohydrate,
      },
      include: {
        menu: { include: { menuFoods: { include: { food: true } } } },
        dailyMenuFoods: true,
      },
    })

    return NextResponse.json(dailyMenu)
  } catch (error) {
    console.error('Update daily menu error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await prisma.dailyMenu.delete({ where: { id } })
    return NextResponse.json({ message: 'Deleted' })
  } catch (error) {
    console.error('Delete daily menu error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
