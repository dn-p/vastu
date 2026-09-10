const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. CLEANUP DATABASE (Hapus data lama)
  console.log('🧹 Cleaning up old data...');
  // Hapus dengan urutan yang benar untuk menghindari error Foreign Key
  await prisma.materialLog.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.progressLog.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.material.deleteMany({});
  console.log('✨ Database cleaned');

  // 2. Seed Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const pm = await prisma.user.upsert({
    where: { email: 'pm@vastu.com' },
    update: {},
    create: {
      email: 'pm@vastu.com',
      password: hashedPassword,
      name: 'Budi Santoso',
      role: 'PM',
    },
  });

  const mandor = await prisma.user.upsert({
    where: { email: 'mandor@vastu.com' },
    update: {},
    create: {
      email: 'mandor@vastu.com',
      password: hashedPassword,
      name: 'Ahmad Mandor',
      role: 'MANDOR',
    },
  });

  const adminLogistik = await prisma.user.upsert({
    where: { email: 'logistik@vastu.com' },
    update: {},
    create: {
      email: 'logistik@vastu.com',
      password: hashedPassword,
      name: 'Siti Logistik',
      role: 'ADMIN_LOGISTIK',
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@vastu.com' },
    update: {},
    create: {
      email: 'owner@vastu.com',
      password: hashedPassword,
      name: 'Pak Owner',
      role: 'OWNER',
    },
  });

  console.log('✅ Users created');

  // Seed Master Materials
  const materials = [
    { name: 'Semen Portland', unit: 'sak', minStock: 50, description: 'Semen untuk konstruksi umum' },
    { name: 'Besi Beton 10mm', unit: 'batang', minStock: 100, description: 'Besi tulangan diameter 10mm' },
    { name: 'Besi Beton 12mm', unit: 'batang', minStock: 80, description: 'Besi tulangan diameter 12mm' },
    { name: 'Pasir', unit: 'kubik', minStock: 10, description: 'Pasir bangunan halus' },
    { name: 'Batu Split', unit: 'kubik', minStock: 8, description: 'Batu split untuk beton' },
    { name: 'Bata Merah', unit: 'buah', minStock: 2000, description: 'Bata merah standar' },
    { name: 'Kayu Usuk', unit: 'batang', minStock: 50, description: 'Kayu 5/7 untuk bekisting' },
    { name: 'Triplek 9mm', unit: 'lembar', minStock: 30, description: 'Triplek untuk bekisting' },
    { name: 'Cat Tembok', unit: 'kg', minStock: 20, description: 'Cat tembok eksterior/interior' },
    { name: 'Keramik 40x40', unit: 'dos', minStock: 50, description: 'Keramik lantai 40x40 cm' },
  ];

  for (const mat of materials) {
    await prisma.material.upsert({
      where: { name: mat.name },
      update: {},
      create: mat,
    });
  }

  console.log('✅ Master materials created');

  // Seed Sample Project
  const project = await prisma.project.create({
    data: {
      name: 'Pembangunan Ruko Sudirman',
      location: 'Jl. Sudirman No. 123, Jakarta Pusat',
      description: '3 lantai, luas 200m², target selesai 12 bulan',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'ACTIVE',
      createdBy: pm.id,
    },
  });

  console.log('✅ Sample project created');

  // Seed WBS Tasks
  const persiapan = await prisma.task.create({
    data: {
      projectId: project.id,
      name: 'Persiapan',
      description: 'Tahap persiapan dan mobilisasi',
      weightPercent: 5,
      plannedStart: new Date('2026-01-01'),
      plannedEnd: new Date('2026-01-15'),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        projectId: project.id,
        parentId: persiapan.id,
        name: 'Pembersihan Lahan',
        description: 'Bersihkan area dari vegetasi dan debris',
        weightPercent: 2,
        plannedStart: new Date('2026-01-01'),
        plannedEnd: new Date('2026-01-07'),
      },
      {
        projectId: project.id,
        parentId: persiapan.id,
        name: 'Mobilisasi Alat',
        description: 'Pengiriman alat berat dan peralatan',
        weightPercent: 3,
        plannedStart: new Date('2026-01-08'),
        plannedEnd: new Date('2026-01-15'),
      },
    ],
  });

  const pondasi = await prisma.task.create({
    data: {
      projectId: project.id,
      name: 'Pondasi',
      description: 'Pekerjaan pondasi dan basement',
      weightPercent: 20,
      plannedStart: new Date('2026-01-16'),
      plannedEnd: new Date('2026-03-15'),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        projectId: project.id,
        parentId: pondasi.id,
        name: 'Galian Tanah',
        description: 'Penggalian untuk pondasi',
        weightPercent: 5,
        plannedStart: new Date('2026-01-16'),
        plannedEnd: new Date('2026-01-31'),
      },
      {
        projectId: project.id,
        parentId: pondasi.id,
        name: 'Pengecoran Pondasi',
        description: 'Pengecoran pondasi foot plat',
        weightPercent: 10,
        plannedStart: new Date('2026-02-01'),
        plannedEnd: new Date('2026-02-28'),
      },
      {
        projectId: project.id,
        parentId: pondasi.id,
        name: 'Pemasangan Sloof',
        description: 'Pemasangan balok sloof dan kolom pedestal',
        weightPercent: 5,
        plannedStart: new Date('2026-03-01'),
        plannedEnd: new Date('2026-03-15'),
      },
    ],
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      name: 'Struktur',
      description: 'Pekerjaan struktur bangunan utama',
      weightPercent: 40,
      plannedStart: new Date('2026-03-16'),
      plannedEnd: new Date('2026-08-31'),
    },
  });

  await prisma.task.create({
    data: {
      projectId: project.id,
      name: 'Finishing',
      description: 'Pekerjaan finishing dan interior',
      weightPercent: 35,
      plannedStart: new Date('2026-09-01'),
      plannedEnd: new Date('2026-12-31'),
    },
  });

  console.log('✅ WBS Tasks seeded');
  console.log('\n🎉 Database seeding complete!');
  console.log('\n📋 Test Accounts:');
  console.log('  PM:        pm@vastu.com        / password123');
  console.log('  Mandor:    mandor@vastu.com     / password123');
  console.log('  Logistik:  logistik@vastu.com   / password123');
  console.log('  Owner:     owner@vastu.com      / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
