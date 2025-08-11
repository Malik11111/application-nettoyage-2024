import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateNassimaTemplate, generateTasksFromTemplate } from '../services/templateGenerator';

const prisma = new PrismaClient();

async function setupNassimaProfile() {
  try {
    console.log('🚀 Configuration du profil Nassima...');

    // 1. Créer un admin si nécessaire
    let admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      admin = await prisma.user.create({
        data: {
          email: 'admin@cleaning.com',
          name: 'Administrateur',
          role: 'ADMIN',
          password: hashedPassword,
        }
      });
      console.log('✅ Compte administrateur créé');
    }

    // 2. Générer le template Nassima avec tous les lieux
    console.log('📋 Génération du template Nassima...');
    const template = await generateNassimaTemplate();
    console.log('✅ Template Nassima créé avec succès');

    // 3. Générer les tâches pour aujourd'hui
    const today = new Date();
    console.log('📅 Génération des tâches pour aujourd\'hui...');
    const todayTasks = await generateTasksFromTemplate(template.id, today);
    console.log(`✅ ${todayTasks.length} tâches générées pour aujourd'hui`);

    // 4. Générer les tâches pour demain
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    console.log('📅 Génération des tâches pour demain...');
    const tomorrowTasks = await generateTasksFromTemplate(template.id, tomorrow);
    console.log(`✅ ${tomorrowTasks.length} tâches générées pour demain`);

    console.log('\n🎉 Configuration terminée !');
    console.log('\n📊 Résumé :');
    console.log(`- Agent : Nassima (nassima@cleaning.com)`);
    console.log(`- Template : ${template.name}`);
    console.log(`- Lieux configurés : 13 lieux sur le RDC`);
    console.log(`- Tâches aujourd'hui : ${todayTasks.length}`);
    console.log(`- Tâches demain : ${tomorrowTasks.length}`);
    console.log('\n🔑 Comptes de connexion :');
    console.log(`- Admin : admin@cleaning.com / admin123`);
    console.log(`- Agent : nassima@cleaning.com / password`);
    console.log('\n🌐 Interface agent : http://localhost:5173/agent');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  setupNassimaProfile()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

export { setupNassimaProfile };