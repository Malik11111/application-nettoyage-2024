import { PrismaClient } from '@prisma/client';
import { CronJob } from 'cron';
import { smartDailyStartup } from './dailyTaskGenerator';

const prisma = new PrismaClient();

/**
 * Service de génération automatique des tâches quotidiennes
 * Fonctionne avec le planning hebdomadaire configuré par les admins
 */

// Job principal qui s'exécute chaque jour à 6h30
let dailyTaskJob: CronJob | null = null;

export const startScheduledTaskGeneration = (): void => {
  console.log('\n🚀 Démarrage du système de génération automatique des tâches...');

  // Arrêter le job existant s'il y en a un
  if (dailyTaskJob) {
    dailyTaskJob.stop();
    console.log('🛑 Arrêt du job précédent');
  }

  // Créer un nouveau job qui s'exécute tous les jours à 6h00
  dailyTaskJob = new CronJob(
    '0 6 * * *', // Cron expression: 6h00 tous les jours
    async () => {
      const today = new Date();
      console.log(`\n🌅 [${today.toLocaleString('fr-FR')}] Génération automatique des tâches quotidiennes...`);
      
      try {
        // Utiliser smartDailyStartup qui respecte le planning hebdomadaire
        await smartDailyStartup(today);
        console.log(`✅ [${today.toLocaleTimeString('fr-FR')}] Génération automatique réussie!`);
      } catch (error) {
        console.error(`❌ [${today.toLocaleTimeString('fr-FR')}] Erreur lors de la génération automatique:`, error);
        
        // Envoyer une notification d'erreur (optionnel)
        await logError(error as Error, today);
      }
    },
    null, // onComplete
    true, // start
    'Europe/Paris' // timezone
  );

  console.log('⏰ Job programmé: génération quotidienne à 6h00 (Europe/Paris)');
  console.log('📋 Le système vérifiera chaque jour s\'il faut générer des tâches selon le planning hebdomadaire');
};

export const stopScheduledTaskGeneration = (): void => {
  if (dailyTaskJob) {
    dailyTaskJob.stop();
    dailyTaskJob = null;
    console.log('🛑 Système de génération automatique arrêté');
  }
};

export const getScheduledTaskStatus = (): { isRunning: boolean; nextRun?: string } => {
  if (!dailyTaskJob) {
    return { isRunning: false };
  }

  try {
    const nextDate = dailyTaskJob.nextDate();
    return {
      isRunning: true,
      nextRun: nextDate ? nextDate.toJSDate().toLocaleString('fr-FR') : undefined
    };
  } catch (error) {
    return {
      isRunning: true,
      nextRun: 'Prochaine exécution: 6h00 chaque jour'
    };
  }
};

// Test immédiat du système (pour développement)
export const testScheduledGeneration = async (): Promise<void> => {
  console.log('\n🧪 Test de la génération automatique...');
  
  const testDate = new Date();
  console.log(`📅 Test pour: ${testDate.toLocaleDateString('fr-FR')}`);
  
  try {
    await smartDailyStartup(testDate);
    console.log('✅ Test de génération automatique réussi!');
  } catch (error) {
    console.error('❌ Test de génération automatique échoué:', error);
    throw error;
  }
};

// Log des erreurs pour suivi
const logError = async (error: Error, date: Date): Promise<void> => {
  try {
    // Ici on pourrait enregistrer l'erreur en base de données
    // ou envoyer un email à l'administrateur
    
    console.error(`📝 Erreur enregistrée pour ${date.toLocaleDateString('fr-FR')}:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // TODO: Implémenter notification par email ou Slack
    
  } catch (logError) {
    console.error('❌ Impossible d\'enregistrer l\'erreur:', logError);
  }
};

// Fonction pour forcer une génération immédiate (pour les admins)
export const forceGenerateToday = async (): Promise<void> => {
  console.log('\n🔄 Génération forcée des tâches pour aujourd\'hui...');
  
  try {
    await smartDailyStartup(new Date());
    console.log('✅ Génération forcée réussie!');
  } catch (error) {
    console.error('❌ Génération forcée échouée:', error);
    throw error;
  }
};

// Fonction pour générer les tâches pour une date spécifique
export const generateForDate = async (targetDate: Date): Promise<void> => {
  console.log(`\n📅 Génération des tâches pour ${targetDate.toLocaleDateString('fr-FR')}...`);
  
  try {
    await smartDailyStartup(targetDate);
    console.log(`✅ Génération réussie pour ${targetDate.toLocaleDateString('fr-FR')}!`);
  } catch (error) {
    console.error(`❌ Génération échouée pour ${targetDate.toLocaleDateString('fr-FR')}:`, error);
    throw error;
  }
};

// Planning des prochaines générations (pour l'interface admin)
export const getUpcomingGenerations = (): Array<{ date: string; dayName: string; willGenerate: boolean }> => {
  const upcoming = [];
  const today = new Date();
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[date.getDay()];
    
    upcoming.push({
      date: date.toLocaleDateString('fr-FR'),
      dayName,
      willGenerate: true // sera déterminé par le planning hebdomadaire
    });
  }
  
  return upcoming;
};

console.log('📋 Service de génération automatique des tâches chargé');