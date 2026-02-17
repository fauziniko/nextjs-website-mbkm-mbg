'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Beef,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { toast } from 'sonner'

interface FoodType {
  id: string
  name: string
  energyLarge: number
  proteinLarge: number
  fatLarge: number
  fiberLarge: number
  carbohydrateLarge: number
  energySmall: number
  proteinSmall: number
  fatSmall: number
  fiberSmall: number
  carbohydrateSmall: number
}

const defaultForm = {
  name: '',
  energyLarge: 0, proteinLarge: 0, fatLarge: 0, fiberLarge: 0, carbohydrateLarge: 0,
  energySmall: 0, proteinSmall: 0, fatSmall: 0, fiberSmall: 0, carbohydrateSmall: 0,
}

export default function FoodTypesPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [foods, setFoods] = useState<FoodType[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<FoodType | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchFoods = () => {
    fetch('/api/food-types')
      .then((res) => res.json())
      .then(setFoods)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchFoods() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEdit = (food: FoodType) => {
    setEditing(food)
    setForm({
      name: food.name,
      energyLarge: food.energyLarge, proteinLarge: food.proteinLarge, fatLarge: food.fatLarge, fiberLarge: food.fiberLarge, carbohydrateLarge: food.carbohydrateLarge,
      energySmall: food.energySmall, proteinSmall: food.proteinSmall, fatSmall: food.fatSmall, fiberSmall: food.fiberSmall, carbohydrateSmall: food.carbohydrateSmall,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editing ? `/api/food-types/${editing.id}` : '/api/food-types'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Berhasil diperbarui' : 'Berhasil ditambahkan')
      setShowModal(false)
      fetchFoods()
    } catch {
      toast.error('Gagal menyimpan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus?')) return
    try {
      await fetch(`/api/food-types/${id}`, { method: 'DELETE' })
      toast.success('Berhasil dihapus')
      fetchFoods()
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  const filtered = foods.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

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
            <Beef className="w-7 h-7 text-sky-500" />
            Data Jenis Makanan
          </h1>
          <p className="text-(--color-text-muted) mt-1">Kelola data gizi per jenis makanan (porsi besar &amp; kecil)</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-sky-500/25"
          >
            <Plus className="w-4 h-4" />
            Tambah Makanan
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari makanan..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-(--color-border) bg-(--color-bg-card) focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none text-sm"
        />
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((food) => (
          <div
            key={food.id}
            className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) shadow-sm overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Header */}
            <div className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm truncate flex-1">{food.name}</h3>
                {isAdmin && (
                  <div className="flex items-center gap-0.5 ml-2 shrink-0">
                    <button onClick={() => openEdit(food)} className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-500 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(food.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Porsi Besar (always visible) */}
            <div className="px-4 pb-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">Porsi Besar</p>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { label: 'Energi', val: food.energyLarge, unit: 'kkal' },
                  { label: 'Protein', val: food.proteinLarge, unit: 'g' },
                  { label: 'Lemak', val: food.fatLarge, unit: 'g' },
                  { label: 'Serat', val: food.fiberLarge, unit: 'g' },
                  { label: 'Karbo', val: food.carbohydrateLarge, unit: 'g' },
                ].map((n) => (
                  <div key={n.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg py-1.5 px-1">
                    <p className="text-[10px] text-(--color-text-muted) truncate">{n.label}</p>
                    <p className="text-xs font-bold">{n.val}</p>
                    <p className="text-[9px] text-(--color-text-muted)">{n.unit}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Expand/Collapse Porsi Kecil */}
            <button
              onClick={() => setExpandedId(expandedId === food.id ? null : food.id)}
              className="w-full px-4 py-2 flex items-center justify-center gap-1 text-xs text-(--color-text-muted) hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-t border-(--color-border)"
            >
              {expandedId === food.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Porsi Kecil
            </button>

            {expandedId === food.id && (
              <div className="px-4 pb-3">
                <div className="grid grid-cols-5 gap-1 text-center">
                  {[
                    { label: 'Energi', val: food.energySmall, unit: 'kkal' },
                    { label: 'Protein', val: food.proteinSmall, unit: 'g' },
                    { label: 'Lemak', val: food.fatSmall, unit: 'g' },
                    { label: 'Serat', val: food.fiberSmall, unit: 'g' },
                    { label: 'Karbo', val: food.carbohydrateSmall, unit: 'g' },
                  ].map((n) => (
                    <div key={n.label} className="bg-orange-50 dark:bg-orange-900/20 rounded-lg py-1.5 px-1">
                      <p className="text-[10px] text-(--color-text-muted) truncate">{n.label}</p>
                      <p className="text-xs font-bold">{n.val}</p>
                      <p className="text-[9px] text-(--color-text-muted)">{n.unit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-(--color-text-muted) text-sm">
            Tidak ada data
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-(--color-border) sticky top-0 bg-(--color-bg-card) z-10">
              <h3 className="font-semibold">{editing ? 'Edit Makanan' : 'Tambah Makanan'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-(--color-border)">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Makanan</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm"
                  required
                />
              </div>

              {/* Porsi Besar */}
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Porsi Besar</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Energi (kkal)</label>
                    <input type="number" step="0.1" value={form.energyLarge} onChange={(e) => setForm({ ...form, energyLarge: +e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Protein (g)</label>
                    <input type="number" step="0.1" value={form.proteinLarge} onChange={(e) => setForm({ ...form, proteinLarge: +e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Lemak (g)</label>
                    <input type="number" step="0.1" value={form.fatLarge} onChange={(e) => setForm({ ...form, fatLarge: +e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Serat (g)</label>
                    <input type="number" step="0.1" value={form.fiberLarge} onChange={(e) => setForm({ ...form, fiberLarge: +e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Karbohidrat (g)</label>
                    <input type="number" step="0.1" value={form.carbohydrateLarge} onChange={(e) => setForm({ ...form, carbohydrateLarge: +e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                  </div>
                </div>
              </div>

              {/* Porsi Kecil */}
              <div>
                <p className="text-sm font-semibold text-orange-600 dark:text-orange-400 mb-2">Porsi Kecil</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Energi (kkal)</label>
                    <input type="number" step="0.1" value={form.energySmall} onChange={(e) => setForm({ ...form, energySmall: +e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Protein (g)</label>
                    <input type="number" step="0.1" value={form.proteinSmall} onChange={(e) => setForm({ ...form, proteinSmall: +e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Lemak (g)</label>
                    <input type="number" step="0.1" value={form.fatSmall} onChange={(e) => setForm({ ...form, fatSmall: +e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Serat (g)</label>
                    <input type="number" step="0.1" value={form.fiberSmall} onChange={(e) => setForm({ ...form, fiberSmall: +e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Karbohidrat (g)</label>
                    <input type="number" step="0.1" value={form.carbohydrateSmall} onChange={(e) => setForm({ ...form, carbohydrateSmall: +e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
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
