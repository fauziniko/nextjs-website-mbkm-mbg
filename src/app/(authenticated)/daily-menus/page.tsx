'use client'

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  Pencil,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ChevronDown,
  ChevronUp,
  Save,
} from 'lucide-react'
import { toast } from 'sonner'

interface DailyMenuFood {
  id: string
  foodName: string
  quantity: number
  confidence: number
  trayClass: string | null
  foodImageUrl: string | null
  energy: number
  protein: number
  fat: number
  fiber: number
  carbohydrate: number
  energySmall: number
  proteinSmall: number
  fatSmall: number
  fiberSmall: number
  carbohydrateSmall: number
}

interface DailyMenuData {
  id: string
  date: string
  notes: string | null
  originalImageUrl: string | null
  detectedImageUrl: string | null
  customEnergy: number | null
  customProtein: number | null
  customFat: number | null
  customCarbohydrate: number | null
  menu: {
    id: string
    name: string
    totalEnergy: number
    totalProtein: number
    totalFat: number
    totalCarbohydrate: number
  } | null
  dailyMenuFoods: DailyMenuFood[]
  user: { name: string; email: string }
}

interface AkgThreshold {
  energy: number
  protein: number
  fat: number
  carbohydrate: number
}

export default function DailyMenusPage() {
  const [dailyMenus, setDailyMenus] = useState<DailyMenuData[]>([])
  const [akg, setAkg] = useState<AkgThreshold | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFoods, setEditFoods] = useState<DailyMenuFood[]>([])
  const [saving, setSaving] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [portionView, setPortionView] = useState<'large' | 'small'>('large')

  const fetchData = () => {
    const dateParam = dateFilter ? `?date=${dateFilter}` : ''
    Promise.all([
      fetch(`/api/daily-menus${dateParam}`).then((r) => r.json()),
      fetch('/api/akg').then((r) => r.json()),
    ])
      .then(([d, a]) => {
        setDailyMenus(d)
        setAkg(a?.[0] || null)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [dateFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const startEdit = (dm: DailyMenuData) => {
    setEditingId(dm.id)
    setEditFoods(dm.dailyMenuFoods.map((f) => ({ ...f })))
    setExpandedId(dm.id)
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/daily-menus/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foods: editFoods }),
      })
      if (!res.ok) throw new Error()
      toast.success('Gizi diperbarui')
      setEditingId(null)
      fetchData()
    } catch {
      toast.error('Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus menu harian ini?')) return
    try {
      await fetch(`/api/daily-menus/${id}`, { method: 'DELETE' })
      toast.success('Menu harian dihapus')
      fetchData()
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  const getTotals = (dm: DailyMenuData, portion: 'large' | 'small' = 'large') => {
    if (dm.customEnergy !== null) {
      return {
        energy: dm.customEnergy,
        protein: dm.customProtein || 0,
        fat: dm.customFat || 0,
        fiber: 0,
        carbohydrate: dm.customCarbohydrate || 0,
      }
    }
    if (portion === 'small') {
      return {
        energy: dm.dailyMenuFoods.reduce((s, f) => s + f.energySmall * f.quantity, 0),
        protein: dm.dailyMenuFoods.reduce((s, f) => s + f.proteinSmall * f.quantity, 0),
        fat: dm.dailyMenuFoods.reduce((s, f) => s + f.fatSmall * f.quantity, 0),
        fiber: dm.dailyMenuFoods.reduce((s, f) => s + f.fiberSmall * f.quantity, 0),
        carbohydrate: dm.dailyMenuFoods.reduce((s, f) => s + f.carbohydrateSmall * f.quantity, 0),
      }
    }
    return {
      energy: dm.dailyMenuFoods.reduce((s, f) => s + f.energy * f.quantity, 0),
      protein: dm.dailyMenuFoods.reduce((s, f) => s + f.protein * f.quantity, 0),
      fat: dm.dailyMenuFoods.reduce((s, f) => s + f.fat * f.quantity, 0),
      fiber: dm.dailyMenuFoods.reduce((s, f) => s + f.fiber * f.quantity, 0),
      carbohydrate: dm.dailyMenuFoods.reduce((s, f) => s + f.carbohydrate * f.quantity, 0),
    }
  }

  const checkAkg = (totals: { energy: number; protein: number; fat: number; fiber: number; carbohydrate: number }) => {
    if (!akg) return null
    return {
      energy: totals.energy >= akg.energy * 0.8,
      protein: totals.protein >= akg.protein * 0.8,
      fat: totals.fat <= akg.fat * 1.2,
      carbohydrate: totals.carbohydrate >= akg.carbohydrate * 0.8,
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
            <CalendarDays className="w-7 h-7 text-sky-500" />
            Menu Harian
          </h1>
          <p className="text-(--color-text-muted) mt-1">Data menu harian dan evaluasi gizi</p>
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-(--color-border) bg-(--color-bg-card) text-sm outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* AKG Reference */}
      {akg && (
        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-4">
          <p className="text-sm font-medium text-sky-700 dark:text-sky-300 mb-2">Standar AKG per Porsi</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="text-sky-600 dark:text-sky-400">Energi: {akg.energy} kkal</span>
            <span className="text-sky-600 dark:text-sky-400">Protein: {akg.protein}g</span>
            <span className="text-sky-600 dark:text-sky-400">Lemak: {akg.fat}g</span>
            <span className="text-sky-600 dark:text-sky-400">Karbo: {akg.carbohydrate}g</span>
          </div>
        </div>
      )}

      {/* Daily Menu List */}
      <div className="space-y-4">
        {dailyMenus.map((dm) => {
          const totals = getTotals(dm, portionView)
          const akgCheck = checkAkg(totals)
          const allMet = akgCheck ? Object.values(akgCheck).every(Boolean) : false
          const isExpanded = expandedId === dm.id
          const isEditing = editingId === dm.id

          return (
            <div key={dm.id} className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) shadow-sm overflow-hidden">
              {/* Header */}
              <div
                className="p-5 flex items-center gap-4 cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : dm.id)}
              >
                {/* AKG Status */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  allMet
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-amber-100 dark:bg-amber-900/30'
                }`}>
                  {allMet ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{dm.menu?.name || `Menu Deteksi ${new Date(dm.date).toLocaleDateString('id-ID')}`}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      allMet
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {allMet ? 'Memenuhi AKG' : 'Belum Memenuhi AKG'}
                    </span>
                  </div>
                  <p className="text-sm text-(--color-text-muted)">
                    {new Date(dm.date).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{totals.energy.toFixed(0)} kkal</p>
                    <p className="text-xs text-(--color-text-muted)">
                      P:{totals.protein.toFixed(1)}g L:{totals.fat.toFixed(1)}g K:{totals.carbohydrate.toFixed(1)}g
                    </p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); startEdit(dm) }}
                    className="p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-500">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(dm.id) }}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-(--color-text-muted)" /> : <ChevronDown className="w-5 h-5 text-(--color-text-muted)" />}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-(--color-border) pt-4 space-y-4">
                  {/* Portion Toggle */}
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Ukuran Porsi</p>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                      <button
                        onClick={() => setPortionView('large')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${portionView === 'large' ? 'bg-emerald-500 text-white shadow-sm' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                        Porsi Besar
                      </button>
                      <button
                        onClick={() => setPortionView('small')}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${portionView === 'small' ? 'bg-orange-500 text-white shadow-sm' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                      >
                        Porsi Kecil
                      </button>
                    </div>
                  </div>

                  {/* Images side by side */}
                  {(dm.originalImageUrl || dm.detectedImageUrl) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {dm.originalImageUrl && (
                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Eye className="w-4 h-4" /> Gambar Asli
                          </p>
                          <img src={dm.originalImageUrl} alt="Original" className="w-full rounded-xl border border-(--color-border) object-contain" />
                        </div>
                      )}
                      {dm.detectedImageUrl && (
                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Eye className="w-4 h-4" /> Hasil Prediksi Omprengan
                          </p>
                          <img src={dm.detectedImageUrl} alt="Prediksi ML" className="w-full rounded-xl border border-(--color-border) object-contain" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Food list - view or edit */}
                  <div>
                    <p className="text-sm font-medium mb-2">Detail Makanan</p>
                    {isEditing ? (
                      <div className="space-y-2">
                        {editFoods.map((food, idx) => (
                          <div key={food.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                            <p className="font-medium text-sm">{food.foodName}</p>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              <div>
                                <label className="text-xs text-(--color-text-muted)">Porsi</label>
                                <input type="number" step="0.1" min="0.1" value={food.quantity}
                                  onChange={(e) => {
                                    const f = [...editFoods]; f[idx].quantity = +e.target.value; setEditFoods(f)
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg border border-(--color-border) bg-white dark:bg-slate-700 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-(--color-text-muted)">Energi</label>
                                <input type="number" step="0.1" value={food.energy}
                                  onChange={(e) => {
                                    const f = [...editFoods]; f[idx].energy = +e.target.value; setEditFoods(f)
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg border border-(--color-border) bg-white dark:bg-slate-700 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-(--color-text-muted)">Protein</label>
                                <input type="number" step="0.1" value={food.protein}
                                  onChange={(e) => {
                                    const f = [...editFoods]; f[idx].protein = +e.target.value; setEditFoods(f)
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg border border-(--color-border) bg-white dark:bg-slate-700 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-(--color-text-muted)">Lemak</label>
                                <input type="number" step="0.1" value={food.fat}
                                  onChange={(e) => {
                                    const f = [...editFoods]; f[idx].fat = +e.target.value; setEditFoods(f)
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg border border-(--color-border) bg-white dark:bg-slate-700 text-sm" />
                              </div>
                              <div>
                                <label className="text-xs text-(--color-text-muted)">Karbo</label>
                                <input type="number" step="0.1" value={food.carbohydrate}
                                  onChange={(e) => {
                                    const f = [...editFoods]; f[idx].carbohydrate = +e.target.value; setEditFoods(f)
                                  }}
                                  className="w-full px-2 py-1.5 rounded-lg border border-(--color-border) bg-white dark:bg-slate-700 text-sm" />
                              </div>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => saveEdit(dm.id)} disabled={saving}
                            className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Simpan Perubahan
                          </button>
                          <button onClick={() => setEditingId(null)}
                            className="px-4 py-2.5 rounded-xl border border-(--color-border) text-sm hover:bg-slate-50 dark:hover:bg-slate-700">
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {dm.dailyMenuFoods.map((food) => {
                          const e = portionView === 'large' ? food.energy : food.energySmall
                          const p = portionView === 'large' ? food.protein : food.proteinSmall
                          const l = portionView === 'large' ? food.fat : food.fatSmall
                          const s = portionView === 'large' ? food.fiber : food.fiberSmall
                          const k = portionView === 'large' ? food.carbohydrate : food.carbohydrateSmall
                          return (
                            <div key={food.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-(--color-border) overflow-hidden">
                              {food.foodImageUrl && (
                                <div className="aspect-square bg-slate-100 dark:bg-slate-700">
                                  <img src={food.foodImageUrl} alt={food.foodName} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="p-2.5">
                                <p className="font-semibold text-xs truncate">{food.foodName}</p>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <span className="text-[10px] text-(--color-text-muted)">
                                    {(food.confidence * 100).toFixed(0)}%
                                  </span>
                                  {food.trayClass && (
                                    <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-600 text-[9px] font-medium text-(--color-text-muted)">
                                      {food.trayClass.replace('food-tray-', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-0.5 text-[10px]">
                                  <div className="flex justify-between"><span className="text-(--color-text-muted)">Energi</span><span>{e} kkal</span></div>
                                  <div className="flex justify-between"><span className="text-(--color-text-muted)">Protein</span><span>{p} g</span></div>
                                  <div className="flex justify-between"><span className="text-(--color-text-muted)">Lemak</span><span>{l} g</span></div>
                                  <div className="flex justify-between"><span className="text-(--color-text-muted)">Serat</span><span>{s} g</span></div>
                                  <div className="flex justify-between"><span className="text-(--color-text-muted)">Karbo</span><span>{k} g</span></div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                        {dm.dailyMenuFoods.length === 0 && (
                          <p className="text-sm text-(--color-text-muted) col-span-full">Belum ada detail makanan</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* AKG check details */}
                  {akgCheck && akg && (
                    <div>
                      <p className="text-sm font-medium mb-2">Evaluasi AKG ({portionView === 'large' ? 'Porsi Besar' : 'Porsi Kecil'})</p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { label: 'Energi', value: totals.energy, target: akg.energy, unit: 'kkal', met: akgCheck.energy },
                          { label: 'Protein', value: totals.protein, target: akg.protein, unit: 'g', met: akgCheck.protein },
                          { label: 'Lemak', value: totals.fat, target: akg.fat, unit: 'g', met: akgCheck.fat },
                          { label: 'Serat', value: totals.fiber, target: 4, unit: 'g', met: totals.fiber >= 3 },
                          { label: 'Karbo', value: totals.carbohydrate, target: akg.carbohydrate, unit: 'g', met: akgCheck.carbohydrate },
                        ].map((item) => {
                          const pct = item.target > 0 ? (item.value / item.target) * 100 : 0
                          return (
                            <div key={item.label} className={`p-3 rounded-xl border ${
                              item.met
                                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                                : 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                            }`}>
                              <p className="text-xs font-medium text-(--color-text-muted)">{item.label}</p>
                              <p className="text-lg font-bold">
                                {item.value.toFixed(1)} <span className="text-xs font-normal">{item.unit}</span>
                              </p>
                              <div className="mt-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${item.met ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                              <p className="text-xs mt-1 text-(--color-text-muted)">
                                {pct.toFixed(0)}% dari {item.target} {item.unit}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {dailyMenus.length === 0 && (
          <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) p-8 text-center text-(--color-text-muted) text-sm">
            Tidak ada data menu harian{dateFilter ? ` pada tanggal ${dateFilter}` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
