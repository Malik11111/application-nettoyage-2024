import { PrismaClient } from '@prisma/client';
import { generateDailyTasksForAllAgents, resetAllTaskTimers, cleanupOldTasks } from '../src/services/dailyTaskGenerator';

const prisma = new PrismaClient();

async function testMaintenance() {
  try {
    console.log('🧪 Testing daily maintenance system...\n');

    // 1. Test task generation
    console.log('1. Testing task generation for today...');
    await generateDailyTasksForAllAgents();

    // Count tasks created today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const tasksToday = await prisma.task.findMany({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      include: {
        assignedAgent: true,
        location: true
      }
    });

    console.log(`✅ Found ${tasksToday.length} tasks for today`);

    // Group by agent
    const tasksByAgent = tasksToday.reduce((acc: any, task) => {
      const agentName = task.assignedAgent?.name || 'Non assigné';
      if (!acc[agentName]) acc[agentName] = [];
      acc[agentName].push(task);
      return acc;
    }, {});

    console.log('\n📋 Tasks by agent:');
    Object.entries(tasksByAgent).forEach(([agent, tasks]: [string, any]) => {
      console.log(`   ${agent}: ${tasks.length} tasks`);
      tasks.slice(0, 3).forEach((task: any) => {
        console.log(`     - ${task.scheduledTime}: ${task.location.name}`);
      });
      if (tasks.length > 3) {
        console.log(`     ... and ${tasks.length - 3} more`);
      }
    });

    // 2. Test timer reset
    console.log('\n2. Testing timer reset...');
    
    // First, simulate some tasks in progress
    const tasksToUpdate = tasksToday.slice(0, 2);
    for (const task of tasksToUpdate) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'IN_PROGRESS',
          startTime: new Date(),
          actualDuration: 10
        }
      });
    }
    console.log(`   Set ${tasksToUpdate.length} tasks to IN_PROGRESS`);

    // Now reset them
    await resetAllTaskTimers();
    
    // Check if they're reset
    const resetTasks = await prisma.task.findMany({
      where: {
        id: { in: tasksToUpdate.map(t => t.id) }
      }
    });

    const resetCount = resetTasks.filter(t => 
      t.status === 'PENDING' && 
      t.startTime === null && 
      t.actualDuration === null
    ).length;

    console.log(`✅ Successfully reset ${resetCount}/${tasksToUpdate.length} tasks`);

    // 3. Test cleanup (create old task first)
    console.log('\n3. Testing old task cleanup...');
    
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45); // 45 days ago

    // Create an old task
    const oldTask = await prisma.task.create({
      data: {
        title: 'Test old task',
        locationId: tasksToday[0]?.locationId,
        scheduledDate: oldDate,
        status: 'COMPLETED'
      }
    });

    console.log(`   Created test old task from ${oldDate.toLocaleDateString('fr-FR')}`);

    // Clean up (keep last 30 days)
    await cleanupOldTasks(30);

    // Check if old task was deleted
    const deletedTask = await prisma.task.findUnique({
      where: { id: oldTask.id }
    });

    if (!deletedTask) {
      console.log('✅ Old task successfully cleaned up');
    } else {
      console.log('❌ Old task was not cleaned up');
    }

    console.log('\n🎉 All maintenance tests completed successfully!');

    // Display summary
    console.log('\n📊 System Summary:');
    const agents = await prisma.user.count({ where: { role: 'AGENT' } });
    const currentTasks = await prisma.task.count({
      where: {
        scheduledDate: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });
    
    console.log(`   • Active agents: ${agents}`);
    console.log(`   • Tasks today: ${currentTasks}`);
    console.log(`   • Average tasks per agent: ${agents > 0 ? Math.round(currentTasks / agents) : 0}`);

    console.log('\n💡 To run daily maintenance:');
    console.log('   • Manually: npm run maintenance:daily');
    console.log('   • Via API: POST /api/maintenance/daily-maintenance');
    console.log('   • Setup cron job: 0 6 * * * (daily at 6am)');

  } catch (error) {
    console.error('❌ Maintenance test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  testMaintenance();
}

export default testMaintenance;