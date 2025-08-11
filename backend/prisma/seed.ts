import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cleaning.com' },
    update: {},
    create: {
      email: 'admin@cleaning.com',
      password: adminPassword,
      name: 'Administrateur',
      role: 'ADMIN',
    },
  });

  // Create agent users
  const agentPassword = await bcrypt.hash('agent123', 10);
  const agents = await Promise.all([
    prisma.user.upsert({
      where: { email: 'marie.dupont@cleaning.com' },
      update: {},
      create: {
        email: 'marie.dupont@cleaning.com',
        password: agentPassword,
        name: 'Marie Dupont',
        role: 'AGENT',
      },
    }),
    prisma.user.upsert({
      where: { email: 'pierre.martin@cleaning.com' },
      update: {},
      create: {
        email: 'pierre.martin@cleaning.com',
        password: agentPassword,
        name: 'Pierre Martin',
        role: 'AGENT',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sophie.bernard@cleaning.com' },
      update: {},
      create: {
        email: 'sophie.bernard@cleaning.com',
        password: agentPassword,
        name: 'Sophie Bernard',
        role: 'AGENT',
      },
    }),
  ]);

  // Create locations
  const locations = await Promise.all([
    prisma.location.upsert({
      where: { id: 'rdc-bureau' },
      update: {},
      create: {
        id: 'rdc-bureau',
        name: 'RDC Bureau',
        description: 'Bureaux du rez-de-chaussée',
        floor: 'RDC',
        type: 'bureau',
      },
    }),
    prisma.location.upsert({
      where: { id: 'rdc-atelier' },
      update: {},
      create: {
        id: 'rdc-atelier',
        name: 'RDC Atelier',
        description: 'Atelier du rez-de-chaussée',
        floor: 'RDC',
        type: 'atelier',
      },
    }),
    prisma.location.upsert({
      where: { id: 'etage1-bureau' },
      update: {},
      create: {
        id: 'etage1-bureau',
        name: '1er Étage Bureau',
        description: 'Bureaux du premier étage',
        floor: '1er',
        type: 'bureau',
      },
    }),
    prisma.location.upsert({
      where: { id: 'etage1-atelier' },
      update: {},
      create: {
        id: 'etage1-atelier',
        name: '1er Étage Atelier',
        description: 'Atelier du premier étage',
        floor: '1er',
        type: 'atelier',
      },
    }),
  ]);

  // Create sample tasks
  const tasks = [
    {
      title: 'Nettoyage des bureaux RDC',
      description: 'Nettoyage complet des bureaux du rez-de-chaussée',
      locationId: locations[0].id,
      assignedAgentId: agents[0].id,
      priority: 'HIGH' as const,
      estimatedDuration: 120,
      status: 'IN_PROGRESS' as const,
    },
    {
      title: 'Entretien atelier RDC',
      description: 'Nettoyage et rangement de l\'atelier',
      locationId: locations[1].id,
      assignedAgentId: agents[1].id,
      priority: 'MEDIUM' as const,
      estimatedDuration: 90,
      status: 'COMPLETED' as const,
      actualDuration: 85,
      completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      title: 'Nettoyage bureaux 1er étage',
      description: 'Nettoyage des bureaux du premier étage',
      locationId: locations[2].id,
      assignedAgentId: agents[2].id,
      priority: 'MEDIUM' as const,
      estimatedDuration: 100,
      status: 'PENDING' as const,
    },
    {
      title: 'Maintenance atelier 1er étage',
      description: 'Nettoyage approfondi et maintenance préventive',
      locationId: locations[3].id,
      assignedAgentId: agents[0].id,
      priority: 'LOW' as const,
      estimatedDuration: 150,
      status: 'PENDING' as const,
    },
    {
      title: 'Nettoyage urgent RDC',
      description: 'Intervention urgente suite à incident',
      locationId: locations[0].id,
      assignedAgentId: agents[1].id,
      priority: 'URGENT' as const,
      estimatedDuration: 60,
      status: 'COMPLETED' as const,
      actualDuration: 45,
      completedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: task,
    });
  }

  console.log('Database seeded successfully!');
  console.log('Admin credentials: admin@cleaning.com / admin123');
  console.log('Agent credentials: marie.dupont@cleaning.com / agent123');
  console.log('Agent credentials: pierre.martin@cleaning.com / agent123');
  console.log('Agent credentials: sophie.bernard@cleaning.com / agent123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });