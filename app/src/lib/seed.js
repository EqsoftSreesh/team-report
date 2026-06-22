const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data...');

  // 1. Create Admin User
  const adminPassword = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
      active: true,
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // 2. Create Teams
  const teamsData = [
    { name: 'Web Team', color: '#B829FF', icon: '🌐' },
    { name: 'Mobile Team', color: '#00F0FF', icon: '📱' },
    { name: 'Desktop Team', color: '#FF2A55', icon: '💻' }
  ];

  for (const t of teamsData) {
    await prisma.team.upsert({
      where: { id: t.name === 'Web Team' ? 1 : t.name === 'Mobile Team' ? 2 : 3 },
      update: {},
      create: t,
    });
  }
  console.log('Created teams');

  // 3. Create Projects
  const projectsData = [
    { name: 'Dashboard Redesign', color: '#00F0FF', teamId: 1 },
    { name: 'iOS Release', color: '#B829FF', teamId: 2 },
    { name: 'Windows Installer', color: '#FF2A55', teamId: 3 }
  ];

  for (const p of projectsData) {
    await prisma.project.upsert({
      where: { id: p.name === 'Dashboard Redesign' ? 1 : p.name === 'iOS Release' ? 2 : 3 },
      update: {},
      create: p,
    });
  }
  console.log('Created projects');
  
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
