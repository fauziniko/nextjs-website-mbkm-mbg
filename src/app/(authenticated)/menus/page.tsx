'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  UtensilsCrossed,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Upload,
  Download,
  ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface FoodType {
  id: string
  name: string
  imageUrl: string | null
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

interface MenuFood {
  id: string
  quantity: number
  food: FoodType
}

interface MenuData {
  id: string
  name: string
  description: string | null
  imageUrl: string | null
  detectedImageUrl: string | null
  totalEnergy: number
  totalProtein: number
  totalFat: number
  totalFiber: number
  totalCarbohydrate: number
  menuFoods: MenuFood[]
}

interface AkgThreshold {
  energy: number
  protein: number
  fat: number
  fiber: number
  carbohydrate: number
}

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
  menu: {
    id: string
    name: string
  } | null
  dailyMenuFoods: DailyMenuFood[]
  user: { name: string; email: string }
}

export default function MenusPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [menus, setMenus] = useState<MenuData[]>([])
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([])
  const [akgList, setAkgList] = useState<AkgThreshold[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [portionView, setPortionView] = useState<'large' | 'small'>('large')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<MenuData | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    imageUrl: '' as string,
    detectedImageUrl: '' as string,
    foods: [] as { foodId: string; quantity: number }[],
    foodImages: [] as { foodId: string; imageUrl: string }[],
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [detectedPreview, setDetectedPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Import from daily-menus
  const [showImportModal, setShowImportModal] = useState(false)
  const [dailyMenus, setDailyMenus] = useState<DailyMenuData[]>([])
  const [loadingDailyMenus, setLoadingDailyMenus] = useState(false)

  const fetchData = () => {
    Promise.all([
      fetch('/api/menus').then((r) => r.json()),
      fetch('/api/food-types').then((r) => r.json()),
      fetch('/api/akg').then((r) => r.json()),
    ])
      .then(([m, f, a]) => {
        setMenus(m)
        setFoodTypes(f)
        setAkgList(a || [])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [])

  const akg = akgList.length > 0 ? akgList[0] : null

  const getTotals = (menu: MenuData, portion: 'large' | 'small' = 'large') => {
    if (portion === 'small') {
      return {
        energy: menu.menuFoods.reduce((s, mf) => s + mf.food.energySmall * mf.quantity, 0),
        protein: menu.menuFoods.reduce((s, mf) => s + mf.food.proteinSmall * mf.quantity, 0),
        fat: menu.menuFoods.reduce((s, mf) => s + mf.food.fatSmall * mf.quantity, 0),
        fiber: menu.menuFoods.reduce((s, mf) => s + mf.food.fiberSmall * mf.quantity, 0),
        carbohydrate: menu.menuFoods.reduce((s, mf) => s + mf.food.carbohydrateSmall * mf.quantity, 0),
      }
    }
    return {
      energy: menu.menuFoods.reduce((s, mf) => s + mf.food.energyLarge * mf.quantity, 0),
      protein: menu.menuFoods.reduce((s, mf) => s + mf.food.proteinLarge * mf.quantity, 0),
      fat: menu.menuFoods.reduce((s, mf) => s + mf.food.fatLarge * mf.quantity, 0),
      fiber: menu.menuFoods.reduce((s, mf) => s + mf.food.fiberLarge * mf.quantity, 0),
      carbohydrate: menu.menuFoods.reduce((s, mf) => s + mf.food.carbohydrateLarge * mf.quantity, 0),
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

  // --- Image upload ---
  const handleImageUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setForm((prev) => ({ ...prev, imageUrl: data.url }))
      setImagePreview(data.url)
      toast.success('Foto berhasil diunggah')
    } catch {
      toast.error('Gagal mengunggah foto')
    } finally {
      setUploading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', imageUrl: '', detectedImageUrl: '', foods: [], foodImages: [] })
    setImagePreview(null)
    setDetectedPreview(null)
    setShowModal(true)
  }

  const openEdit = (menu: MenuData) => {
    setEditing(menu)
    setForm({
      name: menu.name,
      description: menu.description || '',
      imageUrl: menu.imageUrl || '',
      detectedImageUrl: menu.detectedImageUrl || '',
      foods: menu.menuFoods.map((mf) => ({ foodId: mf.food.id, quantity: mf.quantity })),
      foodImages: [],
    })
    setImagePreview(menu.imageUrl || null)
    setDetectedPreview(menu.detectedImageUrl || null)
    setShowModal(true)
  }

  const addFoodToForm = () => {
    setForm({ ...form, foods: [...form.foods, { foodId: '', quantity: 1 }] })
  }

  const removeFoodFromForm = (idx: number) => {
    setForm({ ...form, foods: form.foods.filter((_, i) => i !== idx) })
  }

  // --- Import from daily-menus ---
  const openImportModal = async () => {
    setShowImportModal(true)
    setLoadingDailyMenus(true)
    try {
      const res = await fetch('/api/daily-menus')
      const data = await res.json()
      setDailyMenus(data)
    } catch {
      toast.error('Gagal memuat data menu harian')
    } finally {
      setLoadingDailyMenus(false)
    }
  }

  const importFromDailyMenu = (dm: DailyMenuData) => {
    // Map daily menu foods to form foods by matching with food types
    const matchedFoods: { foodId: string; quantity: number }[] = []
    const foodImgs: { foodId: string; imageUrl: string }[] = []
    for (const dmf of dm.dailyMenuFoods) {
      const matched = foodTypes.find(
        (ft) => ft.name.toLowerCase() === dmf.foodName.toLowerCase()
      )
      if (matched) {
        matchedFoods.push({ foodId: matched.id, quantity: dmf.quantity })
        if (dmf.foodImageUrl) {
          foodImgs.push({ foodId: matched.id, imageUrl: dmf.foodImageUrl })
        }
      }
    }

    const menuName = dm.menu?.name || `Menu ${new Date(dm.date).toLocaleDateString('id-ID')}`
    setForm({
      name: menuName,
      description: dm.notes || '',
      imageUrl: dm.originalImageUrl || '',
      detectedImageUrl: dm.detectedImageUrl || '',
      foods: matchedFoods,
      foodImages: foodImgs,
    })
    setImagePreview(dm.originalImageUrl || null)
    setDetectedPreview(dm.detectedImageUrl || null)
    setShowImportModal(false)
    setShowModal(true)
    toast.success(`Data dari "${menuName}" berhasil diimpor`)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editing ? `/api/menus/${editing.id}` : '/api/menus'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success(editing ? 'Menu diperbarui' : 'Menu ditambahkan')
      setShowModal(false)
      fetchData()
    } catch {
      toast.error('Gagal menyimpan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus menu ini?')) return
    try {
      await fetch(`/api/menus/${id}`, { method: 'DELETE' })
      toast.success('Menu dihapus')
      fetchData()
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  const filtered = menus.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))

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
            <UtensilsCrossed className="w-7 h-7 text-sky-500" />
            Data Menu Makanan
          </h1>
          <p className="text-(--color-text-muted) mt-1">Kelola data menu dan total gizi per menu</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={openImportModal}
              className="px-4 py-2.5 rounded-xl border border-sky-500 text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sm font-medium flex items-center gap-2 transition-colors">
              <Download className="w-4 h-4" />
              Impor dari Menu Harian
            </button>
            <button onClick={openCreate}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-sky-500/25">
              <Plus className="w-4 h-4" />
              Tambah Menu
            </button>
          </div>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--color-text-muted)" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari menu..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-(--color-border) bg-(--color-bg-card) focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none text-sm" />
      </div>

      {/* AKG Reference */}
      {akg && (
        <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-4">
          <p className="text-sm font-medium text-sky-700 dark:text-sky-300 mb-2">Standar AKG per Porsi</p>
          <div className="flex flex-wrap gap-4 text-xs">
            <span className="text-sky-600 dark:text-sky-400">Energi: {akg.energy} kkal</span>
            <span className="text-sky-600 dark:text-sky-400">Protein: {akg.protein}g</span>
            <span className="text-sky-600 dark:text-sky-400">Lemak: {akg.fat}g</span>
            <span className="text-sky-600 dark:text-sky-400">Serat: {akg.fiber}g</span>
            <span className="text-sky-600 dark:text-sky-400">Karbo: {akg.carbohydrate}g</span>
          </div>
        </div>
      )}

      {/* Menu Cards */}
      <div className="space-y-4">
        {filtered.map((menu) => {
          const totals = getTotals(menu, portionView)
          const akgCheck = checkAkg(totals)
          const allMet = akgCheck ? Object.values(akgCheck).every(Boolean) : false
          const isExpanded = expandedId === menu.id

          return (
            <div key={menu.id} className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) shadow-sm overflow-hidden">
              {/* Header */}
              <div className="p-5 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : menu.id)}>
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
                    <h3 className="font-semibold">{menu.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      allMet
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {allMet ? 'Memenuhi AKG' : 'Belum Memenuhi AKG'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-(--color-text-muted) font-medium">
                      {menu.menuFoods.length} makanan
                    </span>
                  </div>
                  {menu.description && <p className="text-sm text-(--color-text-muted) mt-0.5">{menu.description}</p>}
                  <p className="text-sm text-(--color-text-muted)">
                    {totals.energy.toFixed(0)} kkal &middot; P:{totals.protein.toFixed(1)}g L:{totals.fat.toFixed(1)}g K:{totals.carbohydrate.toFixed(1)}g
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium">{totals.energy.toFixed(0)} kkal</p>
                    <p className="text-xs text-(--color-text-muted)">
                      P:{totals.protein.toFixed(1)}g L:{totals.fat.toFixed(1)}g K:{totals.carbohydrate.toFixed(1)}g
                    </p>
                  </div>
                  {isAdmin && (
                    <>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(menu) }}
                        className="p-2 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 text-sky-500">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(menu.id) }}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
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

                  {/* Images side by side like daily-menus */}
                  {(menu.imageUrl || menu.detectedImageUrl) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {menu.imageUrl && (
                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Eye className="w-4 h-4" /> Gambar Asli
                          </p>
                          <img src={menu.imageUrl} alt="Original" className="w-full rounded-xl border border-(--color-border) object-contain" />
                        </div>
                      )}
                      {menu.detectedImageUrl && (
                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-1">
                            <Eye className="w-4 h-4" /> Hasil Prediksi Omprengan
                          </p>
                          <img src={menu.detectedImageUrl} alt="Prediksi ML" className="w-full rounded-xl border border-(--color-border) object-contain" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Detail Makanan - food cards like daily-menus */}
                  <div>
                    <p className="text-sm font-medium mb-2">Detail Makanan</p>
                    {menu.menuFoods.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {menu.menuFoods.map((mf) => {
                          const e = portionView === 'large' ? mf.food.energyLarge : mf.food.energySmall
                          const p = portionView === 'large' ? mf.food.proteinLarge : mf.food.proteinSmall
                          const l = portionView === 'large' ? mf.food.fatLarge : mf.food.fatSmall
                          const s = portionView === 'large' ? mf.food.fiberLarge : mf.food.fiberSmall
                          const k = portionView === 'large' ? mf.food.carbohydrateLarge : mf.food.carbohydrateSmall
                          return (
                            <div key={mf.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-(--color-border) overflow-hidden">
                              {mf.food.imageUrl ? (
                                <div className="aspect-square bg-slate-100 dark:bg-slate-700">
                                  <img src={mf.food.imageUrl} alt={mf.food.name} className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <div className="aspect-square bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                  <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                </div>
                              )}
                              <div className="p-2.5">
                                <p className="font-semibold text-xs truncate">{mf.food.name}</p>
                                <p className="text-[10px] text-(--color-text-muted) mb-2">{mf.quantity} porsi</p>
                                <div className="space-y-0.5 text-[10px]">
                                  <div className="flex justify-between"><span className="text-(--color-text-muted)">Energi</span><span>{(e * mf.quantity).toFixed(0)} kkal</span></div>
                                  <div className="flex justify-between"><span className="text-(--color-text-muted)">Protein</span><span>{(p * mf.quantity).toFixed(1)} g</span></div>
                                  <div className="flex justify-between"><span className="text-(--color-text-muted)">Lemak</span><span>{(l * mf.quantity).toFixed(1)} g</span></div>
                                  <div className="flex justify-between"><span className="text-(--color-text-muted)">Serat</span><span>{(s * mf.quantity).toFixed(1)} g</span></div>
                                  <div className="flex justify-between"><span className="text-(--color-text-muted)">Karbo</span><span>{(k * mf.quantity).toFixed(1)} g</span></div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-(--color-text-muted)">Belum ada komposisi makanan</p>
                    )}
                  </div>

                  {/* AKG Evaluation */}
                  {akgCheck && akg && (
                    <div>
                      <p className="text-sm font-medium mb-2">Evaluasi AKG ({portionView === 'large' ? 'Porsi Besar' : 'Porsi Kecil'})</p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { label: 'Energi', value: totals.energy, target: akg.energy, unit: 'kkal', met: akgCheck.energy },
                          { label: 'Protein', value: totals.protein, target: akg.protein, unit: 'g', met: akgCheck.protein },
                          { label: 'Lemak', value: totals.fat, target: akg.fat, unit: 'g', met: akgCheck.fat },
                          { label: 'Serat', value: totals.fiber, target: akg.fiber, unit: 'g', met: totals.fiber >= akg.fiber * 0.8 },
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

        {filtered.length === 0 && (
          <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) p-8 text-center text-(--color-text-muted) text-sm">
            Tidak ada data menu
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-(--color-border) sticky top-0 bg-(--color-bg-card) rounded-t-2xl z-10">
              <h3 className="font-semibold text-lg">{editing ? 'Edit Menu' : 'Tambah Menu Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-(--color-border)"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {/* Foto Menu - Gambar Asli & Hasil Prediksi */}
              <div>
                <label className="block text-sm font-medium mb-2">Foto Menu</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Gambar Asli */}
                  <div>
                    <p className="text-xs text-(--color-text-muted) mb-1.5 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Gambar Asli
                    </p>
                    {imagePreview ? (
                      <div className="relative rounded-xl border border-(--color-border) overflow-hidden bg-slate-100 dark:bg-slate-700">
                        <img src={imagePreview} alt="Preview" className="w-full aspect-video object-cover" />
                        <button type="button" onClick={() => { setImagePreview(null); setForm({ ...form, imageUrl: '' }) }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="w-full aspect-video rounded-xl border-2 border-dashed border-(--color-border) flex flex-col items-center justify-center gap-2 hover:border-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/10 transition-colors disabled:opacity-50">
                        {uploading ? (
                          <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-(--color-text-muted)" />
                            <span className="text-xs text-(--color-text-muted)">Unggah Foto Asli</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {/* Hasil Prediksi Omprengan */}
                  <div>
                    <p className="text-xs text-(--color-text-muted) mb-1.5 flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Hasil Prediksi Omprengan
                    </p>
                    {detectedPreview ? (
                      <div className="relative rounded-xl border border-(--color-border) overflow-hidden bg-slate-100 dark:bg-slate-700">
                        <img src={detectedPreview} alt="Prediksi" className="w-full aspect-video object-cover" />
                        <button type="button" onClick={() => { setDetectedPreview(null); setForm({ ...form, detectedImageUrl: '' }) }}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-xl border-2 border-dashed border-(--color-border) flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-800/30">
                        <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                        <span className="text-xs text-(--color-text-muted)">Otomatis dari impor</span>
                      </div>
                    )}
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Nama Menu</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm" required
                  placeholder="Contoh: Menu Makan Siang 1" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-sky-500 outline-none text-sm resize-none" rows={2}
                  placeholder="Deskripsi singkat menu..." />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Komposisi Makanan</label>
                  <button type="button" onClick={addFoodToForm}
                    className="text-xs text-sky-500 hover:text-sky-600 font-medium flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Tambah Makanan
                  </button>
                </div>
                {form.foods.length === 0 && (
                  <p className="text-xs text-(--color-text-muted) mb-2">Belum ada makanan. Klik &quot;Tambah Makanan&quot; untuk menambahkan.</p>
                )}
                <div className="space-y-2">
                  {form.foods.map((f, idx) => {
                    const selectedFood = foodTypes.find((ft) => ft.id === f.foodId)
                    return (
                      <div key={idx} className="flex gap-2 items-center">
                        {selectedFood?.imageUrl && (
                          <img src={selectedFood.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-(--color-border) shrink-0" />
                        )}
                        <select value={f.foodId} onChange={(e) => {
                          const newFoods = [...form.foods]
                          newFoods[idx].foodId = e.target.value
                          setForm({ ...form, foods: newFoods })
                        }}
                          className="flex-1 px-3 py-2 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 text-sm outline-none">
                          <option value="">Pilih makanan</option>
                          {foodTypes.map((ft) => <option key={ft.id} value={ft.id}>{ft.name}</option>)}
                        </select>
                        <input type="number" step="0.1" min="0.1" value={f.quantity} onChange={(e) => {
                          const newFoods = [...form.foods]
                          newFoods[idx].quantity = +e.target.value
                          setForm({ ...form, foods: newFoods })
                        }}
                          className="w-20 px-3 py-2 rounded-xl border border-(--color-border) bg-slate-50 dark:bg-slate-700 text-sm outline-none" placeholder="Porsi" />
                        <button type="button" onClick={() => removeFoodFromForm(idx)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Preview nutrisi */}
              {form.foods.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-(--color-border)">
                  <p className="text-xs font-medium text-(--color-text-muted) mb-2">Preview Gizi (Porsi Besar)</p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {(() => {
                      let energy = 0, protein = 0, fat = 0, fiber = 0, carbo = 0
                      for (const f of form.foods) {
                        const ft = foodTypes.find((t) => t.id === f.foodId)
                        if (ft) {
                          energy += ft.energyLarge * f.quantity
                          protein += ft.proteinLarge * f.quantity
                          fat += ft.fatLarge * f.quantity
                          fiber += ft.fiberLarge * f.quantity
                          carbo += ft.carbohydrateLarge * f.quantity
                        }
                      }
                      return (
                        <>
                          <span className="px-2 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300">{energy.toFixed(0)} kkal</span>
                          <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">P: {protein.toFixed(1)}g</span>
                          <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">L: {fat.toFixed(1)}g</span>
                          <span className="px-2 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">S: {fiber.toFixed(1)}g</span>
                          <span className="px-2 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">K: {carbo.toFixed(1)}g</span>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}

              <button type="submit" disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Perbarui' : 'Simpan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Import from Daily Menu Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowImportModal(false)}>
          <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-(--color-border) sticky top-0 bg-(--color-bg-card) rounded-t-2xl z-10">
              <div>
                <h3 className="font-semibold text-lg">Impor dari Menu Harian</h3>
                <p className="text-sm text-(--color-text-muted) mt-0.5">Pilih menu harian untuk dijadikan template menu baru</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-1 rounded-lg hover:bg-(--color-border)"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              {loadingDailyMenus ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
                </div>
              ) : dailyMenus.length === 0 ? (
                <p className="text-center text-(--color-text-muted) py-12">Belum ada data menu harian</p>
              ) : (
                <div className="space-y-3">
                  {dailyMenus.map((dm) => (
                    <div key={dm.id}
                      className="p-4 rounded-xl border border-(--color-border) hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-900/10 cursor-pointer transition-all flex items-center gap-4"
                      onClick={() => importFromDailyMenu(dm)}
                    >
                      {/* Thumbnail */}
                      {(dm.originalImageUrl || dm.detectedImageUrl) ? (
                        <img
                          src={dm.originalImageUrl || dm.detectedImageUrl || ''}
                          alt="Menu"
                          className="w-16 h-16 rounded-lg object-cover border border-(--color-border) shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {dm.menu?.name || `Menu Deteksi ${new Date(dm.date).toLocaleDateString('id-ID')}`}
                        </p>
                        <p className="text-xs text-(--color-text-muted)">
                          {new Date(dm.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {dm.dailyMenuFoods.slice(0, 4).map((f) => (
                            <span key={f.id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-(--color-text-muted)">
                              {f.foodName}
                            </span>
                          ))}
                          {dm.dailyMenuFoods.length > 4 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-(--color-text-muted)">
                              +{dm.dailyMenuFoods.length - 4} lainnya
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span className="text-xs text-sky-500 font-medium flex items-center gap-1">
                          <Download className="w-3 h-3" /> Impor
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
