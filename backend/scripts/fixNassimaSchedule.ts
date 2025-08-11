import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNassimaSchedule() {
  try {
    console.log('🧹 Cleaning up Nassima\'s schedule...');

    // Find Nassima
    const nassima = await prisma.user.findUnique({
      where: { email: 'nassima@cleaning.com' }
    });

    if (!nassima) {
      console.log('❌ Nassima not found');
      return;
    }

    // Delete all existing tasks for Nassima
    const deletedTasks = await prisma.task.deleteMany({
      where: { assignedAgentId: nassima.id }
    });
    console.log(`🗑️ Deleted ${deletedTasks.count} existing tasks`);

    // Define the CORRECT sequential schedule
    const correctSchedule = [
      // Morning priority (7:00-9:00) - Before children arrive at 9h
      { locationName: 'Infirmerie', startTime: '07:00', duration: 20 }, // 7:00 → 7:20
      { locationName: 'Classe 1', startTime: '07:20', duration: 15 },   // 7:20 → 7:35  
      { locationName: 'Classe 2', startTime: '07:35', duration: 15 },   // 7:35 → 7:50
      { locationName: 'Classe 3', startTime: '07:50', duration: 15 },   // 7:50 → 8:05
      { locationName: 'Classe 4', startTime: '08:05', duration: 15 },   // 8:05 → 8:20
      { locationName: 'Sanitaires', startTime: '08:20', duration: 30 }, // 8:20 → 8:50
      
      // Morning (9:00-11:00) - Offices
      { locationName: 'Bureau médecin', startTime: '09:00', duration: 15 },     // 9:00 → 9:15
      { locationName: 'Bureau secrétaire', startTime: '09:15', duration: 12 },  // 9:15 → 9:27
      { locationName: 'Bureau psychologue', startTime: '09:30', duration: 15 }, // 9:30 → 9:45
      
      // PAUSE 11:00-12:00
      
      // Lunch time - Workshops (12:00-13:30) when they are free
      { locationName: 'Atelier restauration', startTime: '12:00', duration: 25 }, // 12:00 → 12:25
      { locationName: 'Atelier HEL', startTime: '12:25', duration: 20 },          // 12:25 → 12:45
      { locationName: 'Atelier horticulture', startTime: '12:45', duration: 30 }, // 12:45 → 13:15
      { locationName: 'Atelier bois', startTime: '13:15', duration: 15 },         // 13:15 → 13:30
      
      // Afternoon (13:30-15:30) - Toilets again
      { locationName: 'Sanitaires', startTime: '13:30', duration: 30 }, // 13:30 → 14:00 (2nd toilets cleaning)
    ];

    console.log('📋 Creating correct sequential schedule:');

    // Create each task with correct timing
    for (const scheduleItem of correctSchedule) {
      const location = await prisma.location.findFirst({
        where: { 
          name: { contains: scheduleItem.locationName }
        }
      });

      if (!location) {
        console.log(`❌ Location not found: ${scheduleItem.locationName}`);
        continue;
      }

      const task = await prisma.task.create({
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

      // Calculate end time for display
      const [hours, minutes] = scheduleItem.startTime.split(':').map(Number);
      const endMinutes = hours * 60 + minutes + scheduleItem.duration;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

      console.log(`✅ ${scheduleItem.startTime} → ${endTime} : ${location.name} (${scheduleItem.duration}min)`);
    }

    console.log('');
    console.log('✅ Nassima\'s schedule fixed successfully!');
    console.log('📅 Correct daily timeline:');
    console.log('   7:00 → Start with Infirmerie');  
    console.log('   7:20 → Classes (1-4) sequentially');
    console.log('   8:20 → Sanitaires before 9h');
    console.log('   9:00 → Offices');
    console.log('   11:00-12:00 → PAUSE ☕');
    console.log('   12:00 → Ateliers sequentially');  
    console.log('   13:30 → Final toilets cleaning');

  } catch (error) {
    console.error('❌ Error fixing schedule:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNassimaSchedule();