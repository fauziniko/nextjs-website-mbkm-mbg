'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Lock, Save, Loader2, Shield, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  createdAt: string
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        setProfile(data)
        setForm({ name: data.name, email: data.email, password: '' })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const body: Record<string, string> = { name: form.name, email: form.email }
      if (form.password) body.password = form.password

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error()
      
      toast.success('Profil diperbarui')
      setForm({ ...form, password: '' })
      
      // Update session
      await update({ name: form.name, email: form.email })
    } catch {
      toast.error('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="w-7 h-7 text-sky-500" />
          Profil
        </h1>
        <p className="text-(--color-text-muted) mt-1">Kelola informasi akun Anda</p>
      </div>

      {/* Profile Card */}
      <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-sky-500 to-blue-600 p-8 text-white">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold mb-4">
            {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <h2 className="text-xl font-bold">{profile?.name}</h2>
          <p className="text-sky-100 text-sm">{profile?.email}</p>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1 text-xs bg-white/20 px-3 py-1 rounded-full">
              <Shield className="w-3 h-3" />
              {profile?.role === 'ADMIN' ? 'Administrator' : 'User'}
            </span>
            <span className="flex items-center gap-1 text-xs text-sky-100">
              <Calendar className="w-3 h-3" />
              Bergabung {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Password Baru <span className="text-xs text-(--color-text-muted) font-normal">(kosongkan jika tidak diubah)</span></label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                placeholder="Masukkan password baru"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  )
}
