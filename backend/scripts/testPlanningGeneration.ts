import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3001/api';

// Mock authentication token (replace with real admin token in practice)
let authToken = '';

const testPlanningGeneration = async () => {
  try {
    console.log('🧪 Test de la fonctionnalité de génération de planning...\n');

    // 1. Login as admin to get token
    console.log('1. Connexion administrateur...');
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.error('❌ Aucun utilisateur admin trouvé');
      return;
    }

    // Mock login (in real scenario, you'd use the actual login endpoint)
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminUser.email,
        password: 'admin123' // Default password
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      authToken = loginData.token;
      console.log('✅ Connexion réussie');
    } else {
      console.log('⚠️  Échec de connexion, test sans token');
    }

    // 2. Test getting planning templates
    console.log('\n2. Récupération des templates de planning...');
    const templatesResponse = await fetch(`${BASE_URL}/planning/templates`, {
      headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
    });

    if (templatesResponse.ok) {
      const templates = await templatesResponse.json();
      console.log(`✅ ${templates.length} templates trouvés:`);
      templates.forEach((template: any) => {
        console.log(`   - ${template.name}: ${template.locations.length} lieux`);
      });
    } else {
      console.log('❌ Erreur récupération templates');
    }

    // 3. Test getting agents
    console.log('\n3. Récupération des agents...');
    const agents = await prisma.user.findMany({
      where: { role: 'AGENT' }
    });
    console.log(`✅ ${agents.length} agents trouvés:`);
    agents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.email})`);
    });

    if (agents.length === 0) {
      console.log('⚠️  Aucun agent trouvé. Créez des agents pour tester complètement.');
      return;
    }

    // 4. Test preview planning
    console.log('\n4. Test de prévisualisation de planning...');
    const templates = await prisma.planningTemplate.findMany({ take: 1 });
    
    if (templates.length > 0) {
      const previewData = {
        agentId: agents[0].id,
        templateId: templates[0].id,
        scheduledDate: new Date().toISOString()
      };

      const previewResponse = await fetch(`${BASE_URL}/planning/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify(previewData)
      });

      if (previewResponse.ok) {
        const preview = await previewResponse.json();
        console.log('✅ Prévisualisation réussie:');
        console.log(`   - Durée totale: ${Math.floor(preview.totalDuration / 60)}h ${preview.totalDuration % 60}min`);
        console.log(`   - Nombre de tâches: ${preview.tasks.length}`);
        console.log(`   - Conflits: ${preview.conflicts.length}`);
        console.log(`   - Avertissements: ${preview.warnings.length}`);
        
        if (preview.tasks.length > 0) {
          console.log('   - Première tâche:', preview.tasks[0].locationName, preview.tasks[0].startTime);
        }
      } else {
        const errorText = await previewResponse.text();
        console.log('❌ Erreur prévisualisation:', errorText);
      }
    }

    // 5. Test locations retrieval
    console.log('\n5. Vérification des lieux disponibles...');
    const locations = await prisma.location.findMany();
    console.log(`✅ ${locations.length} lieux trouvés:`);
    
    const locationTypes = locations.reduce((acc: any, loc) => {
      acc[loc.type] = (acc[loc.type] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(locationTypes).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    // 6. Check existing tasks for first agent
    console.log('\n6. Vérification des tâches existantes...');
    const existingTasks = await prisma.task.findMany({
      where: {
        assignedAgentId: agents[0]?.id,
        scheduledDate: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      },
      include: { location: true }
    });

    console.log(`✅ ${existingTasks.length} tâches existantes aujourd'hui pour ${agents[0]?.name}`);
    existingTasks.forEach(task => {
      console.log(`   - ${task.scheduledTime}: ${task.location.name} (${task.status})`);
    });

    console.log('\n🎉 Tests terminés ! La fonctionnalité semble opérationnelle.');
    console.log('\n📋 Résumé:');
    console.log(`   - Templates: ${(await prisma.planningTemplate.count())} disponibles`);
    console.log(`   - Agents: ${agents.length} disponibles`);
    console.log(`   - Lieux: ${locations.length} disponibles`);
    console.log(`   - Tâches du jour: ${existingTasks.length}`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  testPlanningGeneration();
}

export default testPlanningGeneration;