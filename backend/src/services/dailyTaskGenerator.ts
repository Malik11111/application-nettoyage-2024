import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ScheduleItem {
  locationName: string;
  startTime: string;
  duration: number;
}

// Default schedule for agents (can be customized per agent)
const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { locationName: 'infirmerie', startTime: '07:00', duration: 20 },
  { locationName: 'classe 1', startTime: '07:20', duration: 15 },
  { locationName: 'classe 2', startTime: '07:35', duration: 15 },
  { locationName: 'classe 3', startTime: '07:50', duration: 15 },
  { locationName: 'classe 4', startTime: '08:05', duration: 15 },
  { locationName: 'sanitaires RDC', startTime: '08:20', duration: 25 },
  { locationName: 'sanitaires 1er', startTime: '08:45', duration: 25 },
  { locationName: 'bureau 1', startTime: '09:10', duration: 20 },
  { locationName: 'bureau 2', startTime: '09:30', duration: 20 },
  { locationName: 'bureau 3', startTime: '09:50', duration: 20 },
  { locationName: 'couloirs', startTime: '10:10', duration: 30 },
  { locationName: 'hall', startTime: '10:40', duration: 20 },
  // Pause 11h00-12h00
  { locationName: 'atelier 1', startTime: '12:00', duration: 30 },
  { locationName: 'atelier 2', startTime: '12:30', duration: 30 },
  { locationName: 'atelier 3', startTime: '13:00', duration: 30 },
  { locationName: 'salle des profs', startTime: '13:30', duration: 20 },
  { locationName: 'bibliothèque', startTime: '13:50', duration: 30 },
  { locationName: 'cour', startTime: '14:20', duration: 40 },
  { locationName: 'escaliers', startTime: '15:00', duration: 30 },
];

export const generateDailyTasksForAllAgents = async (targetDate?: Date, forceRegenerate: boolean = false): Promise<void> => {
  const date = targetDate || new Date();
  
  try {
    console.log(`🗓️ Generating daily tasks for ${date.toLocaleDateString('fr-FR')}`);

    // Get all active agents
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' }
    });

    console.log(`👥 Found ${agents.length} agents`);

    // For each agent, check if they already have tasks for this date
    for (const agent of agents) {
      console.log(`\n🧹 Processing agent: ${agent.name}`);
      
      // Check existing tasks for this date
      const existingTasks = await prisma.task.findMany({
        where: {
          assignedAgentId: agent.id,
          scheduledDate: {
            gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
            lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
          }
        }
      });

      if (existingTasks.length > 0 && !forceRegenerate) {
        console.log(`   ⚠️ Agent ${agent.name} already has ${existingTasks.length} tasks for this date. Skipping.`);
        console.log(`   💡 Use forceRegenerate=true to recreate tasks`);
        continue;
      }

      if (forceRegenerate && existingTasks.length > 0) {
        console.log(`   🔄 Force regenerating: deleting ${existingTasks.length} existing tasks`);
        await prisma.task.deleteMany({
          where: {
            assignedAgentId: agent.id,
            scheduledDate: {
              gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
              lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
          }
        });
      }

      // Check if there are planning templates with weekly schedule
      const planningTemplates = await prisma.planningTemplate.findMany({
        where: { 
          isActive: true,
          organizationId: agent.organizationId
        }
      });

      // Determine current day of week
      const dayIndex = date.getDay(); // 0 = dimanche, 1 = lundi, etc.
      const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayKey = dayKeys[dayIndex];
      
      console.log(`   📅 Today is: ${currentDayKey} (${date.toLocaleDateString('fr-FR')})`);

      // Check if any template has weekly schedule for today
      let shouldCreateTasks = false;
      let schedule = DEFAULT_SCHEDULE;

      for (const template of planningTemplates) {
        if (template.weeklySchedule && template.weeklySchedule.trim() !== '') {
          try {
            const weeklySchedule = JSON.parse(template.weeklySchedule);
            const todaySchedule = weeklySchedule[currentDayKey];
            
            if (todaySchedule && todaySchedule.isActive && todaySchedule.locations && todaySchedule.locations.length > 0) {
              console.log(`   📋 Found active weekly schedule for ${currentDayKey}`);
              shouldCreateTasks = true;
              
              // Convert locations to schedule format
              schedule = todaySchedule.locations.map((loc: any, index: number) => {
                const startHour = 7 + index * 0.25; // Espacement de 15min
                const startTime = `${Math.floor(startHour).toString().padStart(2, '0')}:${Math.round((startHour % 1) * 60).toString().padStart(2, '0')}`;
                return {
                  locationName: loc.locationId, // Sera résolu plus tard
                  startTime,
                  duration: loc.estimatedDuration || 20
                };
              });
              break;
            }
          } catch (e) {
            console.log(`   ⚠️ Could not parse weekly schedule for template ${template.name}`);
          }
        }
      }

      // If no weekly planning found, check old cleaning templates
      if (!shouldCreateTasks) {
        const customTemplate = await prisma.cleaningTemplate.findFirst({
          where: { 
            agentId: agent.id,
            isActive: true
          }
        });

        if (customTemplate && customTemplate.timeSlots) {
          try {
            const customSlots = JSON.parse(customTemplate.timeSlots);
            if (Array.isArray(customSlots) && customSlots.length > 0) {
              schedule = customSlots;
              shouldCreateTasks = true;
              console.log(`   📋 Using legacy custom schedule for ${agent.name}`);
            }
          } catch (e) {
            console.log(`   ⚠️ Could not parse custom schedule for ${agent.name}`);
          }
        } else {
          // Use default schedule only on weekdays
          if (dayIndex >= 1 && dayIndex <= 5) { // Monday to Friday
            shouldCreateTasks = true;
            console.log(`   📋 Using default weekday schedule`);
          } else {
            console.log(`   🚫 No schedule configured for ${currentDayKey} - skipping`);
          }
        }
      }

      if (!shouldCreateTasks) {
        console.log(`   ✅ No tasks to create for ${agent.name} on ${currentDayKey}`);
        continue;
      }

      console.log(`   🕐 Creating ${schedule.length} tasks...`);

      // Create tasks based on schedule
      const createdTasks = [];
      for (const scheduleItem of schedule) {
        let location;
        
        // For weekly planning, locationName is actually locationId
        if (scheduleItem.locationName && scheduleItem.locationName.length > 10) {
          // This looks like a locationId (CUID)
          location = await prisma.location.findUnique({
            where: { id: scheduleItem.locationName }
          });
        } else {
          // This is a location name (legacy format)
          location = await prisma.location.findFirst({
            where: {
              OR: [
                { name: { contains: scheduleItem.locationName } },
                { name: { equals: scheduleItem.locationName } },
              ]
            }
          });
        }

        if (!location) {
          console.log(`     ❌ Location not found: ${scheduleItem.locationName}`);
          continue;
        }

        // Create the task
        const task = await prisma.task.create({
          data: {
            title: `Nettoyage ${location.name}`,
            description: `Nettoyage quotidien - ${scheduleItem.startTime}`,
            locationId: location.id,
            assignedAgentId: agent.id,
            estimatedDuration: scheduleItem.duration,
            scheduledTime: scheduleItem.startTime,
            scheduledDate: new Date(date),
            status: 'PENDING',
            priority: 'MEDIUM',
            organizationId: agent.organizationId || location.organizationId
          }
        });

        createdTasks.push(task);
      }

      console.log(`   ✅ Created ${createdTasks.length} tasks for ${agent.name}`);
    }

    console.log(`\n🎉 Daily task generation completed for ${date.toLocaleDateString('fr-FR')}`);
    
  } catch (error) {
    console.error('❌ Error generating daily tasks:', error);
    throw error;
  }
};

export const resetAllTaskTimers = async (targetDate?: Date): Promise<void> => {
  const date = targetDate || new Date();
  
  try {
    console.log(`🔄 Resetting task timers for ${date.toLocaleDateString('fr-FR')}`);

    // Reset all tasks for the date to PENDING status and clear timers
    const resetResult = await prisma.task.updateMany({
      where: {
        scheduledDate: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        },
        status: { in: ['IN_PROGRESS', 'COMPLETED'] }
      },
      data: {
        status: 'PENDING',
        startTime: null,
        endTime: null,
        actualDuration: null,
        completedAt: null,
      }
    });

    console.log(`✅ Reset ${resetResult.count} task timers`);
    
  } catch (error) {
    console.error('❌ Error resetting task timers:', error);
    throw error;
  }
};

export const cleanupOldTasks = async (daysToKeep: number = 30): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    console.log(`🧹 Cleaning up tasks older than ${cutoffDate.toLocaleDateString('fr-FR')}`);

    const deleteResult = await prisma.task.deleteMany({
      where: {
        scheduledDate: {
          lt: cutoffDate
        }
      }
    });

    console.log(`✅ Deleted ${deleteResult.count} old tasks`);
    
  } catch (error) {
    console.error('❌ Error cleaning up old tasks:', error);
    throw error;
  }
};

// Smart daily startup - only generates tasks if none exist, always resets timers
export const smartDailyStartup = async (targetDate?: Date): Promise<void> => {
  const date = targetDate || new Date();
  
  console.log(`\n🌅 Smart daily startup for ${date.toLocaleDateString('fr-FR')}`);
  
  try {
    // 1. Always reset timers for the day (agents can restart)
    await resetAllTaskTimers(date);
    
    // 2. Only generate tasks if none exist (preserves admin modifications)
    await generateDailyTasksForAllAgents(date, false);
    
    console.log(`\n✅ Smart daily startup completed!`);
    
  } catch (error) {
    console.error('\n❌ Smart daily startup failed:', error);
    throw error;
  }
};

// Full daily maintenance with task regeneration (admin action)
export const dailyMaintenance = async (forceRegenerate: boolean = false): Promise<void> => {
  const today = new Date();
  
  console.log(`\n🌅 Starting daily maintenance for ${today.toLocaleDateString('fr-FR')}`);
  
  try {
    // 1. Generate/regenerate tasks for today
    await generateDailyTasksForAllAgents(today, forceRegenerate);
    
    // 2. Reset any lingering timers
    await resetAllTaskTimers(today);
    
    // 3. Clean up old tasks (keep last 30 days)
    await cleanupOldTasks(30);
    
    console.log(`\n✅ Daily maintenance completed successfully!`);
    
  } catch (error) {
    console.error('\n❌ Daily maintenance failed:', error);
    throw error;
  }
};

// Just reset timers without touching task assignments
export const resetDailyTimers = async (targetDate?: Date): Promise<void> => {
  const date = targetDate || new Date();
  
  console.log(`\n🔄 Resetting daily timers for ${date.toLocaleDateString('fr-FR')}`);
  
  try {
    await resetAllTaskTimers(date);
    console.log(`\n✅ Daily timer reset completed!`);
  } catch (error) {
    console.error('\n❌ Daily timer reset failed:', error);
    throw error;
  }
};