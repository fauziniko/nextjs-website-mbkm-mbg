'use client'

import { useEffect, useState } from 'react'
import { Activity, Plus, Pencil, Trash2, X, Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'

interface AkgThreshold {
  id: string
  name: string
  description: string | null
  energy: number
  protein: number
  fat: number
  fiber: number
  carbohydrate: number
}

type TabType = 'kecil' | 'besar'

export default function AkgPage() {
  const [thresholds, setThresholds] = useState<AkgThreshold[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<AkgThreshold | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('kecil')
  const [form, setForm] = useState({
    name: '',
    description: '',
    energy: 0,
    protein: 0,
    fat: 0,
    fiber: 0,
    carbohydrate: 0,
  })
  const [submitting, setSubmitting] = useState(false)

  const fetchData = () => {
    fetch('/api/akg')
      .then((r) => r.json())
      .then(setThresholds)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const porsiKecil = thresholds.filter(t => t.description === 'Porsi Kecil')
  const porsiBesar = thresholds.filter(t => t.description === 'Porsi Besar')
  const filtered = activeTab === 'kecil' ? porsiKecil : porsiBesar

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: activeTab === 'kecil' ? 'Porsi Kecil' : 'Porsi Besar', energy: 700, protein: 20, fat: 20, fiber: 8, carbohydrate: 100 })
    setShowModal(true)
  }

  const openEdit = (t: AkgThreshold) => {
    setEditing(t)
    setForm({
      name: t.name,
      description: t.description || '',
      energy: t.energy,
      protein: t.protein,
      fat: t.fat,
      fiber: t.fiber,
      carbohydrate: t.carbohydrate,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editing ? `/api/akg/${editing.id}` : '/api/akg'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Berhasil diperbarui' : 'Berhasil ditambahkan')
      setShowModal(false)
      fetchData()
    } catch {
      toast.error('Gagal menyimpan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus?')) return
    try {
      await fetch(`/api/akg/${id}`, { method: 'DELETE' })
      toast.success('Berhasil dihapus')
      fetchData()
    } catch {
      toast.error('Gagal menghapus')
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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-7 h-7 text-sky-500" />
            Ambang Batas Gizi (AKG)
          </h1>
          <p className="text-(--color-text-muted) mt-1">Standar gizi MBG per porsi makan siang</p>
        </div>
        <button onClick={openCreate}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-sky-500/25">
          <Plus className="w-4 h-4" />
          Tambah Standar
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-sky-700 dark:text-sky-300">Standar AKG MBG</p>
          <p className="text-xs text-sky-600 dark:text-sky-400 mt-1">
            Standar gizi Makanan Bergizi Gratis per porsi makan siang berkisar ±30-35% dari AKG harian.
            Data ini digunakan untuk mengevaluasi apakah menu harian sudah memenuhi standar gizi.
          </p>
        </div>
      </div>

      {/* Tabs Porsi Kecil / Porsi Besar */}
      <div className="flex gap-2 bg-(--color-bg-card) rounded-2xl border border-(--color-border) p-1.5">
        <button
          onClick={() => setActiveTab('kecil')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'kecil'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-(--color-text-muted)'
          }`}
        >
          🍽️ Porsi Kecil
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'kecil' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-600'
          }`}>{porsiKecil.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('besar')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'besar'
              ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
              : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-(--color-text-muted)'
          }`}
        >
          🍱 Porsi Besar
          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
            activeTab === 'besar' ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-600'
          }`}>{porsiBesar.length}</span>
        </button>
      </div>

      {/* Tab Description */}
      <div className={`rounded-2xl p-3 text-center text-sm font-medium ${
        activeTab === 'kecil'
          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
          : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
      }`}>
        {activeTab === 'kecil'
          ? 'Usia ≤ 12 tahun — Porsi Kecil'
          : 'Usia ≥ 13 tahun — Porsi Besar'}
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((t) => (
          <div key={t.id} className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold">{t.name}</h3>
                {t.description && (
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.description === 'Porsi Kecil'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                  }`}>{t.description}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(t)}
                  className="p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-500">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(t.id)}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20">
                <p className="text-xs text-sky-600 dark:text-sky-400 font-medium">Energi</p>
                <p className="text-lg font-bold text-sky-700 dark:text-sky-300">{t.energy} <span className="text-xs font-normal">kkal</span></p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Protein</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{t.protein} <span className="text-xs font-normal">g</span></p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Lemak</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{t.fat} <span className="text-xs font-normal">g</span></p>
              </div>
              <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">Serat</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">{t.fiber} <span className="text-xs font-normal">g</span></p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 col-span-2">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Karbohidrat</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">{t.carbohydrate} <span className="text-xs font-normal">g</span></p>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full bg-(--color-bg-card) rounded-2xl border border-(--color-border) p-8 text-center text-(--color-text-muted) text-sm">
            Belum ada data AKG untuk {activeTab === 'kecil' ? 'Porsi Kecil' : 'Porsi Besar'}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-(--color-border)">
              <h3 className="font-semibold">{editing ? 'Edit Standar AKG' : 'Tambah Standar AKG'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-(--color-border)"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Standar</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Energi (kkal)</label>
                  <input type="number" step="0.1" value={form.energy} onChange={(e) => setForm({ ...form, energy: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Protein (g)</label>
                  <input type="number" step="0.1" value={form.protein} onChange={(e) => setForm({ ...form, protein: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Lemak (g)</label>
                  <input type="number" step="0.1" value={form.fat} onChange={(e) => setForm({ ...form, fat: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Serat (g)</label>
                  <input type="number" step="0.1" value={form.fiber} onChange={(e) => setForm({ ...form, fiber: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Karbohidrat (g)</label>
                  <input type="number" step="0.1" value={form.carbohydrate} onChange={(e) => setForm({ ...form, carbohydrate: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Perbarui' : 'Simpan'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
