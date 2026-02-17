'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Camera,
  UtensilsCrossed,
  Beef,
  Activity,
  CalendarDays,
  User,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronLeft,
  Shield,
} from 'lucide-react'

const adminNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/detection', label: 'Deteksi Menu', icon: Camera },
  { href: '/daily-menus', label: 'Menu Harian', icon: CalendarDays },
  { href: '/menus', label: 'Data Menu', icon: UtensilsCrossed },
  { href: '/food-types', label: 'Jenis Makanan', icon: Beef },
  { href: '/akg', label: 'Ambang Batas AKG', icon: Activity },
  { href: '/profile', label: 'Profil', icon: User },
]

const userNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/detection', label: 'Deteksi Menu', icon: Camera },
  { href: '/daily-menus', label: 'Menu Harian', icon: CalendarDays },
  { href: '/profile', label: 'Profil', icon: User },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const navItems = session?.user?.role === 'ADMIN' ? adminNavItems : userNavItems

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-(--color-border)">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">MBG</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-(--color-border) transition-colors"
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg hover:bg-(--color-border)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && session?.user && (
        <div className="px-4 py-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            session.user.role === 'ADMIN'
              ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
          }`}>
            <Shield className="w-3 h-3" />
            {session.user.role === 'ADMIN' ? 'Administrator' : 'User'}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'text-(--color-text-muted) hover:bg-(--color-border) hover:text-(--color-text)'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-(--color-border) space-y-2">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-(--color-text-muted) hover:bg-(--color-border) transition-colors"
            title={collapsed ? 'Toggle tema' : undefined}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 shrink-0" /> : <Moon className="w-5 h-5 shrink-0" />}
            {!collapsed && <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>}
          </button>
        )}

        {/* User info & logout */}
        {!collapsed && session?.user && (
          <div className="px-3 py-2 rounded-xl bg-(--color-border)/50">
            <p className="text-sm font-medium truncate">{session.user.name}</p>
            <p className="text-xs text-(--color-text-muted) truncate">{session.user.email}</p>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title={collapsed ? 'Keluar' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-(--color-bg-card) shadow-lg border border-(--color-border)"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-(--color-bg-sidebar) border-r border-(--color-border) transform transition-transform ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 bg-(--color-bg-sidebar) border-r border-(--color-border) transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Spacer */}
      <div className={`hidden lg:block shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`} />
    </>
  )
}
