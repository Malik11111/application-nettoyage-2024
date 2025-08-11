import { dailyMaintenance } from '../src/services/dailyTaskGenerator';

async function runDailyMaintenance() {
  try {
    console.log('🚀 Starting daily maintenance script...');
    await dailyMaintenance();
    console.log('🎉 Daily maintenance completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Daily maintenance failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runDailyMaintenance();
}

export default runDailyMaintenance;