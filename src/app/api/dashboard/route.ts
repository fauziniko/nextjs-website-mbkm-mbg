import { NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    // Total daily menus
    const totalDailyMenus = await prisma.dailyMenu.count({
      where: isAdmin ? {} : { userId },
    })

    // Total menus
    const totalMenus = await prisma.menu.count()

    // Total food types
    const totalFoodTypes = await prisma.foodType.count()

    // Total users (admin only)
    const totalUsers = isAdmin ? await prisma.user.count() : 0

    // Recent daily menus
    const recentDailyMenus = await prisma.dailyMenu.findMany({
      where: isAdmin ? {} : { userId },
      include: {
        menu: true,
        dailyMenuFoods: true,
        user: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 5,
    })

    // AKG threshold
    const akgThreshold = await prisma.akgThreshold.findFirst()

    return NextResponse.json({
      totalDailyMenus,
      totalMenus,
      totalFoodTypes,
      totalUsers,
      recentDailyMenus,
      akgThreshold,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
