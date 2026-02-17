import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mbg.com' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@mbg.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  // Create regular user
  const userPassword = await bcrypt.hash('user123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@mbg.com' },
    update: {},
    create: {
      name: 'User Biasa',
      email: 'user@mbg.com',
      password: userPassword,
      role: 'USER',
    },
  })

  // Create AKG threshold (Standar MBG per porsi makan siang ~30-35% AKG harian)
  await prisma.akgThreshold.upsert({
    where: { name: 'Standar MBG Makan Siang' },
    update: {},
    create: {
      name: 'Standar MBG Makan Siang',
      description: 'Standar gizi MBG per porsi makan siang (±30-35% AKG harian)',
      energy: 700,        // kkal
      protein: 20,        // gram
      fat: 20,            // gram
      fiber: 8,           // gram
      carbohydrate: 100,  // gram
    },
  })

  // Hapus semua jenis makanan lama
  await prisma.foodType.deleteMany({})
  console.log('Old food types deleted.')

  // 39 jenis makanan sesuai class ML model
  const foodTypes = [
    // 0 - Acar Timun Wortel
    { name: 'Acar Timun Wortel', energyLarge: 30, proteinLarge: 0.5, fatLarge: 0.2, fiberLarge: 1.0, carbohydrateLarge: 7, energySmall: 15, proteinSmall: 0.25, fatSmall: 0.1, fiberSmall: 0.5, carbohydrateSmall: 3.5 },
    // 1 - Anggur
    { name: 'Anggur', energyLarge: 69, proteinLarge: 0.7, fatLarge: 0.2, fiberLarge: 0.9, carbohydrateLarge: 18, energySmall: 35, proteinSmall: 0.35, fatSmall: 0.1, fiberSmall: 0.45, carbohydrateSmall: 9 },
    // 2 - Apel
    { name: 'Apel', energyLarge: 52, proteinLarge: 0.3, fatLarge: 0.2, fiberLarge: 2.4, carbohydrateLarge: 14, energySmall: 26, proteinSmall: 0.15, fatSmall: 0.1, fiberSmall: 1.2, carbohydrateSmall: 7 },
    // 3 - Ayam Goreng
    { name: 'Ayam Goreng', energyLarge: 260, proteinLarge: 27, fatLarge: 14, fiberLarge: 0, carbohydrateLarge: 8, energySmall: 130, proteinSmall: 13.5, fatSmall: 7, fiberSmall: 0, carbohydrateSmall: 4 },
    // 4 - Ayam Serundeng
    { name: 'Ayam Serundeng', energyLarge: 280, proteinLarge: 25, fatLarge: 16, fiberLarge: 1.5, carbohydrateLarge: 10, energySmall: 140, proteinSmall: 12.5, fatSmall: 8, fiberSmall: 0.75, carbohydrateSmall: 5 },
    // 5 - Bakso Saus BBQ
    { name: 'Bakso Saus BBQ', energyLarge: 220, proteinLarge: 14, fatLarge: 10, fiberLarge: 0.3, carbohydrateLarge: 20, energySmall: 110, proteinSmall: 7, fatSmall: 5, fiberSmall: 0.15, carbohydrateSmall: 10 },
    // 6 - Capcay
    { name: 'Capcay', energyLarge: 80, proteinLarge: 4, fatLarge: 3, fiberLarge: 3.0, carbohydrateLarge: 10, energySmall: 40, proteinSmall: 2, fatSmall: 1.5, fiberSmall: 1.5, carbohydrateSmall: 5 },
    // 7 - Chiken Katsu
    { name: 'Chiken Katsu', energyLarge: 300, proteinLarge: 22, fatLarge: 18, fiberLarge: 0.5, carbohydrateLarge: 15, energySmall: 150, proteinSmall: 11, fatSmall: 9, fiberSmall: 0.25, carbohydrateSmall: 7.5 },
    // 8 - Fla Susu
    { name: 'Fla Susu', energyLarge: 120, proteinLarge: 3, fatLarge: 4, fiberLarge: 0, carbohydrateLarge: 18, energySmall: 60, proteinSmall: 1.5, fatSmall: 2, fiberSmall: 0, carbohydrateSmall: 9 },
    // 9 - Gudeg
    { name: 'Gudeg', energyLarge: 170, proteinLarge: 3, fatLarge: 8, fiberLarge: 2.5, carbohydrateLarge: 22, energySmall: 85, proteinSmall: 1.5, fatSmall: 4, fiberSmall: 1.25, carbohydrateSmall: 11 },
    // 10 - Jagung
    { name: 'Jagung', energyLarge: 96, proteinLarge: 3.4, fatLarge: 1.5, fiberLarge: 2.4, carbohydrateLarge: 21, energySmall: 48, proteinSmall: 1.7, fatSmall: 0.75, fiberSmall: 1.2, carbohydrateSmall: 10.5 },
    // 11 - Jeruk
    { name: 'Jeruk', energyLarge: 47, proteinLarge: 0.9, fatLarge: 0.1, fiberLarge: 2.4, carbohydrateLarge: 12, energySmall: 24, proteinSmall: 0.45, fatSmall: 0.05, fiberSmall: 1.2, carbohydrateSmall: 6 },
    // 12 - Kacang Merah
    { name: 'Kacang Merah', energyLarge: 127, proteinLarge: 8.7, fatLarge: 0.5, fiberLarge: 6.4, carbohydrateLarge: 22, energySmall: 64, proteinSmall: 4.35, fatSmall: 0.25, fiberSmall: 3.2, carbohydrateSmall: 11 },
    // 13 - Keju
    { name: 'Keju', energyLarge: 110, proteinLarge: 7, fatLarge: 9, fiberLarge: 0, carbohydrateLarge: 0.4, energySmall: 55, proteinSmall: 3.5, fatSmall: 4.5, fiberSmall: 0, carbohydrateSmall: 0.2 },
    // 14 - Kelengkeng
    { name: 'Kelengkeng', energyLarge: 60, proteinLarge: 1.3, fatLarge: 0.1, fiberLarge: 1.1, carbohydrateLarge: 15, energySmall: 30, proteinSmall: 0.65, fatSmall: 0.05, fiberSmall: 0.55, carbohydrateSmall: 7.5 },
    // 15 - Ketimun dan Selada
    { name: 'Ketimun dan Selada', energyLarge: 18, proteinLarge: 1, fatLarge: 0.2, fiberLarge: 1.2, carbohydrateLarge: 3, energySmall: 9, proteinSmall: 0.5, fatSmall: 0.1, fiberSmall: 0.6, carbohydrateSmall: 1.5 },
    // 16 - Kwetiaw
    { name: 'Kwetiaw', energyLarge: 270, proteinLarge: 6, fatLarge: 8, fiberLarge: 0.8, carbohydrateLarge: 44, energySmall: 135, proteinSmall: 3, fatSmall: 4, fiberSmall: 0.4, carbohydrateSmall: 22 },
    // 17 - Lele Crispy
    { name: 'Lele Crispy', energyLarge: 240, proteinLarge: 20, fatLarge: 14, fiberLarge: 0.2, carbohydrateLarge: 10, energySmall: 120, proteinSmall: 10, fatSmall: 7, fiberSmall: 0.1, carbohydrateSmall: 5 },
    // 18 - Lontong
    { name: 'Lontong', energyLarge: 150, proteinLarge: 2.5, fatLarge: 0.2, fiberLarge: 0.3, carbohydrateLarge: 34, energySmall: 75, proteinSmall: 1.25, fatSmall: 0.1, fiberSmall: 0.15, carbohydrateSmall: 17 },
    // 19 - Mie
    { name: 'Mie', energyLarge: 290, proteinLarge: 8, fatLarge: 12, fiberLarge: 1.2, carbohydrateLarge: 38, energySmall: 145, proteinSmall: 4, fatSmall: 6, fiberSmall: 0.6, carbohydrateSmall: 19 },
    // 20 - Nasi
    { name: 'Nasi', energyLarge: 175, proteinLarge: 3, fatLarge: 0.3, fiberLarge: 0.4, carbohydrateLarge: 40, energySmall: 87, proteinSmall: 1.5, fatSmall: 0.15, fiberSmall: 0.2, carbohydrateSmall: 20 },
    // 21 - Nasi Daun Jeruk
    { name: 'Nasi Daun Jeruk', energyLarge: 180, proteinLarge: 3, fatLarge: 1, fiberLarge: 0.6, carbohydrateLarge: 40, energySmall: 90, proteinSmall: 1.5, fatSmall: 0.5, fiberSmall: 0.3, carbohydrateSmall: 20 },
    // 22 - Pepes Tahu
    { name: 'Pepes Tahu', energyLarge: 130, proteinLarge: 10, fatLarge: 7, fiberLarge: 1.0, carbohydrateLarge: 6, energySmall: 65, proteinSmall: 5, fatSmall: 3.5, fiberSmall: 0.5, carbohydrateSmall: 3 },
    // 23 - Pisang
    { name: 'Pisang', energyLarge: 90, proteinLarge: 1, fatLarge: 0.3, fiberLarge: 2.6, carbohydrateLarge: 23, energySmall: 45, proteinSmall: 0.5, fatSmall: 0.15, fiberSmall: 1.3, carbohydrateSmall: 11.5 },
    // 24 - Pisang Lampung
    { name: 'Pisang Lampung', energyLarge: 95, proteinLarge: 1.2, fatLarge: 0.3, fiberLarge: 2.8, carbohydrateLarge: 24, energySmall: 48, proteinSmall: 0.6, fatSmall: 0.15, fiberSmall: 1.4, carbohydrateSmall: 12 },
    // 25 - Rolade Asam Manis
    { name: 'Rolade Asam Manis', energyLarge: 200, proteinLarge: 12, fatLarge: 10, fiberLarge: 0.5, carbohydrateLarge: 16, energySmall: 100, proteinSmall: 6, fatSmall: 5, fiberSmall: 0.25, carbohydrateSmall: 8 },
    // 26 - Roti
    { name: 'Roti', energyLarge: 265, proteinLarge: 9, fatLarge: 3.2, fiberLarge: 2.7, carbohydrateLarge: 49, energySmall: 133, proteinSmall: 4.5, fatSmall: 1.6, fiberSmall: 1.35, carbohydrateSmall: 24.5 },
    // 27 - Salad Buah
    { name: 'Salad Buah', energyLarge: 80, proteinLarge: 1, fatLarge: 2, fiberLarge: 2.0, carbohydrateLarge: 16, energySmall: 40, proteinSmall: 0.5, fatSmall: 1, fiberSmall: 1.0, carbohydrateSmall: 8 },
    // 28 - Sawi
    { name: 'Sawi', energyLarge: 25, proteinLarge: 1.5, fatLarge: 0.3, fiberLarge: 2.0, carbohydrateLarge: 4, energySmall: 13, proteinSmall: 0.75, fatSmall: 0.15, fiberSmall: 1.0, carbohydrateSmall: 2 },
    // 29 - Sayur Isi Pepaya
    { name: 'Sayur Isi Pepaya', energyLarge: 40, proteinLarge: 2, fatLarge: 0.5, fiberLarge: 2.5, carbohydrateLarge: 7, energySmall: 20, proteinSmall: 1, fatSmall: 0.25, fiberSmall: 1.25, carbohydrateSmall: 3.5 },
    // 30 - Semur Ayam Kecap
    { name: 'Semur Ayam Kecap', energyLarge: 230, proteinLarge: 22, fatLarge: 12, fiberLarge: 0.5, carbohydrateLarge: 8, energySmall: 115, proteinSmall: 11, fatSmall: 6, fiberSmall: 0.25, carbohydrateSmall: 4 },
    // 31 - Tahu
    { name: 'Tahu', energyLarge: 76, proteinLarge: 8, fatLarge: 4.8, fiberLarge: 0.3, carbohydrateLarge: 1.9, energySmall: 38, proteinSmall: 4, fatSmall: 2.4, fiberSmall: 0.15, carbohydrateSmall: 1 },
    // 32 - Tahu Crispy
    { name: 'Tahu Crispy', energyLarge: 140, proteinLarge: 9, fatLarge: 9, fiberLarge: 0.4, carbohydrateLarge: 6, energySmall: 70, proteinSmall: 4.5, fatSmall: 4.5, fiberSmall: 0.2, carbohydrateSmall: 3 },
    // 33 - Telur
    { name: 'Telur', energyLarge: 155, proteinLarge: 13, fatLarge: 11, fiberLarge: 0, carbohydrateLarge: 1.1, energySmall: 78, proteinSmall: 6.5, fatSmall: 5.5, fiberSmall: 0, carbohydrateSmall: 0.55 },
    // 34 - Telur Semur
    { name: 'Telur Semur', energyLarge: 180, proteinLarge: 13, fatLarge: 12, fiberLarge: 0.2, carbohydrateLarge: 5, energySmall: 90, proteinSmall: 6.5, fatSmall: 6, fiberSmall: 0.1, carbohydrateSmall: 2.5 },
    // 35 - Tempe Goreng
    { name: 'Tempe Goreng', energyLarge: 150, proteinLarge: 11, fatLarge: 8, fiberLarge: 1.4, carbohydrateLarge: 10, energySmall: 75, proteinSmall: 5.5, fatSmall: 4, fiberSmall: 0.7, carbohydrateSmall: 5 },
    // 36 - Tempe Sagu
    { name: 'Tempe Sagu', energyLarge: 165, proteinLarge: 10, fatLarge: 7, fiberLarge: 1.2, carbohydrateLarge: 16, energySmall: 83, proteinSmall: 5, fatSmall: 3.5, fiberSmall: 0.6, carbohydrateSmall: 8 },
    // 37 - Tumis Keciwis
    { name: 'Tumis Keciwis', energyLarge: 55, proteinLarge: 2, fatLarge: 2.5, fiberLarge: 2.0, carbohydrateLarge: 7, energySmall: 28, proteinSmall: 1, fatSmall: 1.25, fiberSmall: 1.0, carbohydrateSmall: 3.5 },
    // 38 - Tumis Koll Wortel
    { name: 'Tumis Koll Wortel', energyLarge: 50, proteinLarge: 1.5, fatLarge: 2, fiberLarge: 2.5, carbohydrateLarge: 7, energySmall: 25, proteinSmall: 0.75, fatSmall: 1, fiberSmall: 1.25, carbohydrateSmall: 3.5 },
  ]

  for (const food of foodTypes) {
    await prisma.foodType.create({
      data: food,
    })
  }

  console.log('Seed completed!')
  console.log('Admin:', admin.email, '/ admin123')
  console.log('User:', user.email, '/ user123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
