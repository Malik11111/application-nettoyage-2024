import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSchedule() {
  const tasks = await prisma.task.findMany({
    where: { 
      assignedAgent: { email: 'nassima@cleaning.com' }
    },
    include: { location: true },
    orderBy: { scheduledTime: 'asc' }
  });

  console.log('🕐 Current Nassima schedule:');
  tasks.forEach(task => {
    console.log(`${task.scheduledTime || 'NO_TIME'} - ${task.location.name} (${task.estimatedDuration || 'NO_DURATION'}min)`);
  });

  await prisma.$disconnect();
}

checkSchedule();