'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Beef,
  CalendarDays,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface DashboardData {
  totalDailyMenus: number
  totalMenus: number
  totalFoodTypes: number
  totalUsers: number
  recentDailyMenus: Array<{
    id: string
    date: string
    menu: { name: string } | null
    dailyMenuFoods: Array<{
      foodName: string
      energy: number
      protein: number
      fat: number
      carbohydrate: number
      quantity: number
    }>
    user: { name: string } | null
    customEnergy: number | null
    customProtein: number | null
    customFat: number | null
    customCarbohydrate: number | null
  }>
  akgThreshold: {
    energy: number
    protein: number
    fat: number
    carbohydrate: number
  } | null
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const stats = [
    {
      label: 'Menu Harian',
      value: data?.totalDailyMenus || 0,
      icon: CalendarDays,
      color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    },
    {
      label: 'Data Menu',
      value: data?.totalMenus || 0,
      icon: UtensilsCrossed,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      label: 'Jenis Makanan',
      value: data?.totalFoodTypes || 0,
      icon: Beef,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    },
    ...(session?.user?.role === 'ADMIN'
      ? [
          {
            label: 'Total User',
            value: data?.totalUsers || 0,
            icon: Users,
            color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <LayoutDashboard className="w-7 h-7 text-sky-500" />
          Dashboard
        </h1>
        <p className="text-(--color-text-muted) mt-1">
          Selamat datang, {session?.user?.name}!
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-(--color-bg-card) rounded-2xl p-5 border border-(--color-border) shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-(--color-text-muted)">{stat.label}</p>
                <p className="text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Daily Menus */}
      <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) shadow-sm">
        <div className="p-5 border-b border-(--color-border)">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-500" />
            Menu Harian Terbaru
          </h2>
        </div>
        <div className="p-5">
          {data?.recentDailyMenus && data.recentDailyMenus.length > 0 ? (
            <div className="space-y-3">
              {data.recentDailyMenus.map((dm) => {
                const totalEnergy = dm.customEnergy ?? dm.dailyMenuFoods.reduce((s, f) => s + f.energy * f.quantity, 0)
                const totalProtein = dm.customProtein ?? dm.dailyMenuFoods.reduce((s, f) => s + f.protein * f.quantity, 0)
                const akgEnergy = data.akgThreshold?.energy || 700
                const meetsAkg = totalEnergy >= akgEnergy * 0.8

                return (
                  <div
                    key={dm.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-(--color-border)"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{dm.menu?.name ?? 'Menu dihapus'}</p>
                        {meetsAkg ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-(--color-text-muted)">
                        {new Date(dm.date).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                        {session?.user?.role === 'ADMIN' && ` • ${dm.user?.name ?? 'Unknown'}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium">{totalEnergy.toFixed(0)} kkal</p>
                      <p className="text-xs text-(--color-text-muted)">{totalProtein.toFixed(1)}g protein</p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-(--color-text-muted) py-8">
              Belum ada data menu harian
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
