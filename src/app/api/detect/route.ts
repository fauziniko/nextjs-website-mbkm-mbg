import { NextRequest, NextResponse } from 'next/server'
import { getApiSession } from '@/lib/api-auth'
import { prisma } from '@/lib/prisma'

const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5000'

export async function POST(req: NextRequest) {
  try {
    const session = await getApiSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const { searchParams } = new URL(req.url)
    const endpoint = searchParams.get('endpoint') || 'pipeline'
    const confThreshold = searchParams.get('conf_threshold') || '0.6'
    const trayMode = searchParams.get('tray_mode') || 'smallest'

    const fileBytes = await file.arrayBuffer()

    // Request 1: Pipeline JSON data (with food/tray images) — use smallest to get per-sekat food assignment
    const mlFormData = new FormData()
    mlFormData.append('file', new Blob([fileBytes], { type: file.type }), file.name)
    const mlUrl = `${ML_API_URL}/predict/${endpoint}?conf_threshold=${confThreshold}&tray_mode=smallest&include_images=1`

    // Request 2: Pipeline annotated image (with labels & bboxes) — use largest to crop to omprengan
    const mlFormData2 = new FormData()
    mlFormData2.append('file', new Blob([fileBytes], { type: file.type }), file.name)
    const imageUrl = `${ML_API_URL}/predict/${endpoint}/image?conf_threshold=${confThreshold}&tray_mode=largest`

    console.log('[DETECT] ML URL:', mlUrl)
    console.log('[DETECT] File:', file.name, file.size, 'bytes')

    const [mlResponse, imageResponse] = await Promise.all([
      fetch(mlUrl, { method: 'POST', body: mlFormData }),
      fetch(imageUrl, { method: 'POST', body: mlFormData2 }).catch(() => null),
    ])

    console.log('[DETECT] ML Response status:', mlResponse.status)

    if (!mlResponse.ok) {
      const errorText = await mlResponse.text()
      console.log('[DETECT] ML Error body:', errorText)
      return NextResponse.json(
        { error: `ML API error: ${errorText}` },
        { status: mlResponse.status }
      )
    }

    const result = await mlResponse.json()

    // Get annotated image as base64
    let annotatedImageBase64: string | null = null
    if (imageResponse && imageResponse.ok) {
      const imageBuffer = await imageResponse.arrayBuffer()
      annotatedImageBase64 = Buffer.from(imageBuffer).toString('base64')
    }

    // Match detected foods with food-types from DB
    const allFoodNames = (result.all_foods || []).map((f: { class_name: string }) => f.class_name)
    const uniqueNames = [...new Set(allFoodNames)] as string[]

    console.log('[DETECT] all_foods from ML:', JSON.stringify(result.all_foods?.map((f: { class_name: string }) => f.class_name)))
    console.log('[DETECT] uniqueNames for DB query:', JSON.stringify(uniqueNames))

    let nutritionMap: Record<string, {
      id: string; name: string;
      energyLarge: number; proteinLarge: number; fatLarge: number; fiberLarge: number; carbohydrateLarge: number;
      energySmall: number; proteinSmall: number; fatSmall: number; fiberSmall: number; carbohydrateSmall: number;
    }> = {}

    if (uniqueNames.length > 0) {
      const foodTypes = await prisma.foodType.findMany({
        where: {
          name: { in: uniqueNames },
        },
      })
      console.log('[DETECT] DB foodTypes found:', foodTypes.length, foodTypes.map(ft => ft.name))
      for (const ft of foodTypes) {
        nutritionMap[ft.name.toLowerCase()] = {
          id: ft.id,
          name: ft.name,
          energyLarge: ft.energyLarge,
          proteinLarge: ft.proteinLarge,
          fatLarge: ft.fatLarge,
          fiberLarge: ft.fiberLarge,
          carbohydrateLarge: ft.carbohydrateLarge,
          energySmall: ft.energySmall,
          proteinSmall: ft.proteinSmall,
          fatSmall: ft.fatSmall,
          fiberSmall: ft.fiberSmall,
          carbohydrateSmall: ft.carbohydrateSmall,
        }
      }
      console.log('[DETECT] nutritionMap keys:', Object.keys(nutritionMap))
    } else {
      console.log('[DETECT] No unique names to query!')
    }

    return NextResponse.json({
      ...result,
      annotated_image_base64: annotatedImageBase64,
      nutrition_map: nutritionMap,
    })
  } catch (error) {
    console.error('Detection error:', error)
    return NextResponse.json(
      { error: 'Failed to connect to ML API' },
      { status: 500 }
    )
  }
}
