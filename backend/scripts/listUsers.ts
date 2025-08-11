import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({ 
    select: { email: true, name: true, role: true } 
  });
  
  console.log('👥 All users in database:');
  users.forEach(user => console.log(`  - ${user.email} (${user.name}) - ${user.role}`));
  
  await prisma.$disconnect();
}

listUsers();