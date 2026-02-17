'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, Loader2, Save, ImageIcon, Utensils, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

const MAX_LAUK = 5

interface NutritionInfo {
  id: string
  name: string
  energyLarge: number; proteinLarge: number; fatLarge: number; fiberLarge: number; carbohydrateLarge: number
  energySmall: number; proteinSmall: number; fatSmall: number; fiberSmall: number; carbohydrateSmall: number
}

interface DetectionFood {
  class_name: string
  confidence: number
  bbox: { x1: number; y1: number; x2: number; y2: number }
  image_base64?: string
}

interface DetectionTray {
  tray_id: number
  tray_class: string
  tray_confidence: number
  tray_bbox?: { x1: number; y1: number; x2: number; y2: number }
  foods: DetectionFood[]
  tray_image_base64?: string
}

interface DetectionResult {
  recognized: boolean
  num_trays: number
  total_foods_detected: number
  trays: DetectionTray[]
  all_foods: Array<{ class_name: string; confidence: number; tray_id?: number; tray_class?: string }>
  total_unique_foods: number
  image_size: { width: number; height: number }
  annotated_image_base64?: string
  nutrition_map?: Record<string, NutritionInfo>
}

export default function DetectionPage() {
  const [image, setImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [portionSize, setPortionSize] = useState<'large' | 'small'>('large')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = () => setImage(reader.result as string)
      reader.readAsDataURL(file)
      setResult(null)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
    } catch {
      toast.error('Tidak dapat mengakses kamera')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(video, 0, 0)
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' })
          setImageFile(file)
          setImage(canvas.toDataURL('image/jpeg'))
          stopCamera()
          setResult(null)
        }
      }, 'image/jpeg', 0.9)
    }
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  const detectMenu = async () => {
    if (!imageFile) {
      toast.error('Pilih gambar terlebih dahulu')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', imageFile)

      const res = await fetch('/api/detect?endpoint=pipeline&tray_mode=largest&include_images=1', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Detection failed')
      }

      const data = await res.json()
      setResult(data)

      if (data.recognized) {
        toast.success(`Terdeteksi ${data.total_unique_foods || data.all_foods?.length || 0} jenis makanan`)
      } else {
        toast.warning('Tidak ada makanan yang terdeteksi')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Gagal mendeteksi')
    } finally {
      setLoading(false)
    }
  }

  // Get unique foods with nutrition data, sorted by sekat number (1→5), then confidence desc
  const getUniqueFoodsWithNutrition = () => {
    if (!result?.all_foods) return []
    // Extract sekat number from tray_class (e.g. "food-tray-sekat-2" → 2)
    const getSekatNum = (f: { tray_class?: string }) => {
      const m = f.tray_class?.match(/sekat-(\d+)/)
      return m ? parseInt(m[1]) : 999
    }
    // Sort: by sekat number ascending, then confidence descending
    const sorted = [...result.all_foods].sort((a, b) => {
      const sekatA = getSekatNum(a)
      const sekatB = getSekatNum(b)
      if (sekatA !== sekatB) return sekatA - sekatB
      return b.confidence - a.confidence
    })
    const seen = new Set<string>()
    return sorted.filter((f) => {
      const key = f.class_name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, MAX_LAUK).map((f) => {
      const nutrition = result.nutrition_map?.[f.class_name.toLowerCase()]
      return { ...f, nutrition }
    })
  }

  // Calculate total nutrition
  const getTotalNutrition = () => {
    const foods = getUniqueFoodsWithNutrition()
    const totals = { energy: 0, protein: 0, fat: 0, fiber: 0, carbohydrate: 0 }
    for (const f of foods) {
      if (f.nutrition) {
        if (portionSize === 'large') {
          totals.energy += f.nutrition.energyLarge
          totals.protein += f.nutrition.proteinLarge
          totals.fat += f.nutrition.fatLarge
          totals.fiber += f.nutrition.fiberLarge
          totals.carbohydrate += f.nutrition.carbohydrateLarge
        } else {
          totals.energy += f.nutrition.energySmall
          totals.protein += f.nutrition.proteinSmall
          totals.fat += f.nutrition.fatSmall
          totals.fiber += f.nutrition.fiberSmall
          totals.carbohydrate += f.nutrition.carbohydrateSmall
        }
      }
    }
    return totals
  }

  const saveAsDaily = async () => {
    if (!result || !result.recognized) return

    setSaving(true)
    try {
      // 1. Upload original image to MinIO
      let originalImageUrl = ''
      if (imageFile) {
        const uploadForm = new FormData()
        uploadForm.append('file', imageFile)
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: uploadForm })
        console.log('[SAVE] Upload original status:', uploadRes.status)
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          originalImageUrl = uploadData.url
          console.log('[SAVE] Original image URL:', originalImageUrl)
        } else {
          console.warn('[SAVE] Upload original failed:', await uploadRes.text())
        }
      }

      // 2. Upload ML images (annotated + food crops) to MinIO via base64
      let detectedImageUrl = ''
      const foodImageUrls: Record<string, string> = {}

      const imagesToUpload: Array<{ base64: string; name: string }> = []
      if (result.annotated_image_base64) {
        imagesToUpload.push({ base64: result.annotated_image_base64, name: 'detected' })
      }

      const foodsWithNutrition = getUniqueFoodsWithNutrition()
      console.log('[SAVE] Foods to save:', foodsWithNutrition.length, foodsWithNutrition.map(f => f.class_name))

      for (const tray of result.trays || []) {
        for (const food of tray.foods) {
          if (food.image_base64 && !foodImageUrls[food.class_name.toLowerCase()]) {
            const inSaveList = foodsWithNutrition.some(f => f.class_name.toLowerCase() === food.class_name.toLowerCase())
            if (inSaveList) {
              imagesToUpload.push({
                base64: food.image_base64,
                name: `food-${food.class_name.replace(/\s+/g, '-').toLowerCase()}`
              })
            }
          }
        }
      }

      console.log('[SAVE] Images to upload:', imagesToUpload.length, imagesToUpload.map(i => i.name))

      if (imagesToUpload.length > 0) {
        const mlUploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images: imagesToUpload }),
        })
        console.log('[SAVE] ML upload status:', mlUploadRes.status)
        if (mlUploadRes.ok) {
          const { urls } = await mlUploadRes.json()
          console.log('[SAVE] ML upload urls:', urls)
          if (urls.detected) detectedImageUrl = urls.detected
          for (const food of foodsWithNutrition) {
            const key = `food-${food.class_name.replace(/\s+/g, '-').toLowerCase()}`
            if (urls[key]) foodImageUrls[food.class_name.toLowerCase()] = urls[key]
          }
        } else {
          console.warn('[SAVE] ML upload failed:', await mlUploadRes.text())
        }
      }

      // 3. Create daily menu with full nutrition data (porsi besar + kecil)
      const payload = {
        originalImageUrl,
        detectedImageUrl,
        foods: foodsWithNutrition.map((f) => {
          const n = f.nutrition
          return {
            foodName: f.class_name,
            quantity: 1,
            confidence: f.confidence,
            trayClass: f.tray_class || null,
            foodImageUrl: foodImageUrls[f.class_name.toLowerCase()] || null,
            energy: n ? n.energyLarge : 0,
            protein: n ? n.proteinLarge : 0,
            fat: n ? n.fatLarge : 0,
            fiber: n ? n.fiberLarge : 0,
            carbohydrate: n ? n.carbohydrateLarge : 0,
            energySmall: n ? n.energySmall : 0,
            proteinSmall: n ? n.proteinSmall : 0,
            fatSmall: n ? n.fatSmall : 0,
            fiberSmall: n ? n.fiberSmall : 0,
            carbohydrateSmall: n ? n.carbohydrateSmall : 0,
          }
        }),
      }
      console.log('[SAVE] Daily menu payload:', JSON.stringify(payload).substring(0, 500))

      const dailyRes = await fetch('/api/daily-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('[SAVE] Daily menu response status:', dailyRes.status)

      if (dailyRes.ok) {
        toast.success('Berhasil disimpan sebagai menu harian!')
      } else {
        const errData = await dailyRes.json().catch(() => ({}))
        console.error('Save daily menu error:', dailyRes.status, errData)
        throw new Error(errData.details || errData.error || 'Failed to save')
      }
    } catch (err) {
      console.error('Save error:', err)
      toast.error(`Gagal menyimpan: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const clearAll = () => {
    setImage(null)
    setImageFile(null)
    setResult(null)
    stopCamera()
  }

  const uniqueFoods = result ? getUniqueFoodsWithNutrition() : []
  const totalNutrition = result ? getTotalNutrition() : null
  const allFoodsCount = result?.all_foods ? [...new Set(result.all_foods.map(f => f.class_name.toLowerCase()))].length : 0
  const isLimited = allFoodsCount > MAX_LAUK

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Camera className="w-7 h-7 text-sky-500" />
          Deteksi Menu Makanan
        </h1>
        <p className="text-(--color-text-muted) mt-1">
          Upload foto atau gunakan kamera untuk mendeteksi makanan
        </p>
      </div>

      {/* Input Section */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) shadow-sm overflow-hidden">
          {/* Camera/Image Preview */}
          <div className="aspect-4/3 bg-slate-100 dark:bg-slate-800 relative flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : image ? (
              <>
                <img src={image} alt="Preview" className="w-full h-full object-contain" />
                <button
                  onClick={clearAll}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="text-center p-8">
                <ImageIcon className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-(--color-text-muted)">
                  Pilih gambar atau gunakan kamera
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-4 flex gap-3">
            {cameraActive ? (
              <>
                <button
                  onClick={capturePhoto}
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Ambil Foto
                </button>
                <button
                  onClick={stopCamera}
                  className="px-4 py-2.5 rounded-xl border border-(--color-border) text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 rounded-xl border-2 border-dashed border-sky-300 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Upload Gambar
                </button>
                <button
                  onClick={startCamera}
                  className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Kamera
                </button>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Detect Button */}
        {image && !cameraActive && (
          <button
            onClick={detectMenu}
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Mendeteksi...
              </>
            ) : (
              <>
                <Utensils className="w-5 h-5" />
                Deteksi Makanan
              </>
            )}
          </button>
        )}
      </div>

      {/* Detection Results */}
      {result && (
        <div className="space-y-4">
          {/* Annotated Omprengan Image (already cropped by ML API) */}
          {result.annotated_image_base64 && result.recognized && (
            <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) shadow-sm overflow-hidden max-w-lg mx-auto">
              <div className="px-4 py-3 border-b border-(--color-border)">
                <h3 className="font-semibold text-sm">Hasil Prediksi Omprengan</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800">
                <img
                  src={`data:image/png;base64,${result.annotated_image_base64}`}
                  alt="Omprengan"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="px-4 py-2 border-t border-(--color-border)">
                <div className="flex justify-between text-xs text-(--color-text-muted) mb-2">
                  <span>{result.num_trays} tray terdeteksi</span>
                  <span>{result.total_foods_detected} makanan terdeteksi</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(result.all_foods || []).map((f, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-[10px] font-medium">
                      {f.class_name}
                      <span className="opacity-60">{(f.confidence * 100).toFixed(0)}%</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Summary & Portion Toggle */}
          <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) shadow-sm p-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
              <h3 className="font-semibold">Hasil Deteksi</h3>
              {result.recognized && (
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setPortionSize('large')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${portionSize === 'large' ? 'bg-emerald-500 text-white shadow-sm' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    Porsi Besar
                  </button>
                  <button
                    onClick={() => setPortionSize('small')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${portionSize === 'small' ? 'bg-orange-500 text-white shadow-sm' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    Porsi Kecil
                  </button>
                </div>
              )}
            </div>

            {result.recognized ? (
              <div className="space-y-2">
                <p className="text-sm text-(--color-text-muted)">
                  Terdeteksi <span className="font-semibold text-sky-500">{(result.trays || []).filter(t => t.foods.length > 0).length}</span> tray,{' '}
                  <span className="font-semibold text-sky-500">{allFoodsCount}</span> jenis makanan
                  {isLimited && (
                    <span className="text-amber-500 text-xs ml-2">(dibatasi {MAX_LAUK} lauk per menu)</span>
                  )}
                </p>

                {isLimited && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-xs text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Hanya {MAX_LAUK} lauk pertama yang akan disimpan ke menu harian.</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-amber-500">Tidak ada makanan yang terdeteksi dalam gambar.</p>
            )}
          </div>

          {/* Detected Foods - Horizontal Compact Cards */}
          {result.recognized && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {uniqueFoods.map((food, i) => {
                // Find the matching food image from trays
                let foodImage: string | undefined
                for (const tray of result.trays || []) {
                  const match = tray.foods.find(
                    (f) => f.class_name.toLowerCase() === food.class_name.toLowerCase() && f.image_base64
                  )
                  if (match) {
                    foodImage = match.image_base64
                    break
                  }
                }

                const n = food.nutrition
                const energy = n ? (portionSize === 'large' ? n.energyLarge : n.energySmall) : null
                const protein = n ? (portionSize === 'large' ? n.proteinLarge : n.proteinSmall) : null
                const fat = n ? (portionSize === 'large' ? n.fatLarge : n.fatSmall) : null
                const fiber = n ? (portionSize === 'large' ? n.fiberLarge : n.fiberSmall) : null
                const carbo = n ? (portionSize === 'large' ? n.carbohydrateLarge : n.carbohydrateSmall) : null

                return (
                  <div
                    key={i}
                    className="bg-(--color-bg-card) rounded-xl border border-(--color-border) shadow-sm overflow-hidden"
                  >
                    {/* Food Image */}
                    {foodImage ? (
                      <div className="aspect-square bg-slate-100 dark:bg-slate-800">
                        <img
                          src={`data:image/png;base64,${foodImage}`}
                          alt={food.class_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Utensils className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      </div>
                    )}

                    {/* Food Info */}
                    <div className="p-2.5">
                      <p className="font-semibold text-xs truncate">{food.class_name}</p>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[10px] text-(--color-text-muted)">
                          {(food.confidence * 100).toFixed(0)}% confidence
                        </span>
                        {food.tray_class && (
                          <span className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[9px] font-medium text-(--color-text-muted)">
                            {food.tray_class.replace('food-tray-', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        )}
                      </div>

                      {/* Nutrition */}
                      {n ? (
                        <div className="space-y-1">
                          {[
                            { label: 'Energi', val: energy, unit: 'kkal' },
                            { label: 'Protein', val: protein, unit: 'g' },
                            { label: 'Lemak', val: fat, unit: 'g' },
                            { label: 'Serat', val: fiber, unit: 'g' },
                            { label: 'Karbo', val: carbo, unit: 'g' },
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between text-[10px]">
                              <span className="text-(--color-text-muted)">{item.label}</span>
                              <span className="font-medium">{item.val} {item.unit}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-amber-500 italic">Data gizi belum tersedia</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Total Nutrition Summary */}
          {result.recognized && totalNutrition && (
            <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) shadow-sm p-5">
              <h3 className="font-semibold text-sm mb-3">
                Total Gizi Menu ({portionSize === 'large' ? 'Porsi Besar' : 'Porsi Kecil'})
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { label: 'Energi', val: totalNutrition.energy.toFixed(1), unit: 'kkal', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
                  { label: 'Protein', val: totalNutrition.protein.toFixed(1), unit: 'g', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
                  { label: 'Lemak', val: totalNutrition.fat.toFixed(1), unit: 'g', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' },
                  { label: 'Serat', val: totalNutrition.fiber.toFixed(1), unit: 'g', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' },
                  { label: 'Karbo', val: totalNutrition.carbohydrate.toFixed(1), unit: 'g', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl p-3 text-center ${item.color}`}>
                    <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">{item.label}</p>
                    <p className="text-lg font-bold mt-0.5">{item.val}</p>
                    <p className="text-[10px] opacity-60">{item.unit}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Button */}
          {result.recognized && (
            <button
              onClick={saveAsDaily}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Simpan Sebagai Menu Harian
            </button>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="bg-(--color-bg-card) rounded-2xl border border-(--color-border) shadow-sm p-8 text-center max-w-2xl mx-auto">
          <Utensils className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-sm text-(--color-text-muted)">
            Upload atau foto makanan untuk memulai deteksi
          </p>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
