import { smartDailyStartup } from '../src/services/dailyTaskGenerator';

async function runSmartDailyStartup() {
  try {
    console.log('🌅 Starting smart daily startup script...');
    console.log('   This is the RECOMMENDED script for daily automation');
    console.log('   - Resets timers for fresh start');
    console.log('   - Generates tasks only if none exist (preserves admin modifications)');
    console.log('');
    
    await smartDailyStartup();
    
    console.log('🎉 Smart daily startup completed successfully!');
    console.log('💡 Setup as cron job: 0 6 * * 1-5  (6AM, Monday to Friday)');
    process.exit(0);
  } catch (error) {
    console.error('❌ Smart daily startup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runSmartDailyStartup();
}

export default runSmartDailyStartup;