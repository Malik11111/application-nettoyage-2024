import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateNassimaSchedule() {
  try {
    console.log('🕐 Updating Nassima\'s daily schedule...');

    // Find Nassima
    const nassima = await prisma.user.findUnique({
      where: { email: 'nassima@cleaning.com' }
    });

    if (!nassima) {
      console.log('❌ Nassima not found');
      return;
    }

    // Define the schedule according to specifications
    const schedule = [
      // Morning priority (7:00-9:00) - Before children arrive at 9h
      { locationName: 'Infirmerie', startTime: '07:00', duration: 20 },
      { locationName: 'Classe 1', startTime: '07:20', duration: 15 },
      { locationName: 'Classe 2', startTime: '07:35', duration: 15 },
      { locationName: 'Classe 3', startTime: '07:50', duration: 15 },
      { locationName: 'Classe 4', startTime: '08:05', duration: 15 },
      { locationName: 'Sanitaires', startTime: '08:20', duration: 30 },
      
      // Morning (9:00-11:00) - Offices
      { locationName: 'Bureau médecin', startTime: '09:00', duration: 15 },
      { locationName: 'Bureau secrétaire', startTime: '09:15', duration: 12 },
      { locationName: 'Bureau psychologue', startTime: '09:30', duration: 15 },
      
      // PAUSE 11:00-12:00
      
      // Lunch time - Workshops (12:00-13:30) when they are free
      { locationName: 'Atelier restauration', startTime: '12:00', duration: 25 },
      { locationName: 'Atelier HEL', startTime: '12:25', duration: 20 },
      { locationName: 'Atelier horticulture', startTime: '12:45', duration: 30 },
      { locationName: 'Atelier bois', startTime: '13:15', duration: 15 },
      
      // Afternoon (13:30-15:30) - Toilets again
      { locationName: 'Sanitaires', startTime: '13:30', duration: 30 },
    ];

    console.log('📋 Schedule to apply:');
    schedule.forEach(item => {
      console.log(`  ${item.startTime} - ${item.locationName} (${item.duration}min)`);
    });

    // Update each task
    for (const scheduleItem of schedule) {
      const location = await prisma.location.findFirst({
        where: { 
          name: {
            contains: scheduleItem.locationName
          }
        }
      });

      if (!location) {
        console.log(`❌ Location not found: ${scheduleItem.locationName}`);
        continue;
      }

      // Find or create task for this location
      let task = await prisma.task.findFirst({
        where: {
          assignedAgentId: nassima.id,
          locationId: location.id,
          scheduledDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(24, 0, 0, 0))
          }
        }
      });

      if (!task) {
        // Create new task
        task = await prisma.task.create({
          data: {
            title: `Nettoyage ${location.name}`,
            description: `Nettoyage quotidien de ${location.name}`,
            locationId: location.id,
            assignedAgentId: nassima.id,
            status: 'PENDING',
            priority: 'MEDIUM',
            estimatedDuration: scheduleItem.duration,
            scheduledTime: scheduleItem.startTime,
            scheduledDate: new Date(),
            isRecurring: true,
          }
        });
        console.log(`✅ Created task: ${location.name} at ${scheduleItem.startTime}`);
      } else {
        // Update existing task
        await prisma.task.update({
          where: { id: task.id },
          data: {
            scheduledTime: scheduleItem.startTime,
            estimatedDuration: scheduleItem.duration,
            scheduledDate: new Date(),
          }
        });
        console.log(`📝 Updated task: ${location.name} at ${scheduleItem.startTime}`);
      }
    }

    console.log('✅ Nassima\'s schedule updated successfully!');
    console.log('📅 Daily schedule:');
    console.log('   7:00-9:00   → Priority cleaning (infirmerie, classes, toilets)');
    console.log('   9:00-11:00  → Offices');
    console.log('   11:00-12:00 → PAUSE ☕');
    console.log('   12:00-13:30 → Workshops (when free)');
    console.log('   13:30-15:30 → Final cleaning + toilets');

  } catch (error) {
    console.error('❌ Error updating schedule:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateNassimaSchedule();