import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToMultiTenant() {
  try {
    console.log('🚀 Migration vers architecture multi-tenant...\n');

    // 1. Créer l'organisation par défaut
    console.log('1. Création de l\'organisation par défaut...');
    
    const defaultOrg = await prisma.organization.upsert({
      where: { slug: 'mon-etablissement' },
      update: {},
      create: {
        id: 'org_default',
        name: 'Mon Établissement',
        slug: 'mon-etablissement',
        contactEmail: 'admin@etablissement.com',
        subscriptionPlan: 'basic',
        isActive: true
      }
    });

    console.log(`✅ Organisation créée : ${defaultOrg.name} (${defaultOrg.slug})`);

    // 2. Migrer les utilisateurs
    console.log('\n2. Migration des utilisateurs...');
    
    const usersWithoutOrg = await prisma.user.findMany({
      where: { organizationId: null }
    });

    if (usersWithoutOrg.length > 0) {
      await prisma.user.updateMany({
        where: { organizationId: null },
        data: { organizationId: defaultOrg.id }
      });
      console.log(`✅ ${usersWithoutOrg.length} utilisateurs migrés`);
    } else {
      console.log('✅ Aucun utilisateur à migrer');
    }

    // 3. Migrer les lieux
    console.log('\n3. Migration des lieux...');
    
    const locationsWithoutOrg = await prisma.location.findMany({
      where: { organizationId: null }
    });

    if (locationsWithoutOrg.length > 0) {
      await prisma.location.updateMany({
        where: { organizationId: null },
        data: { organizationId: defaultOrg.id }
      });
      console.log(`✅ ${locationsWithoutOrg.length} lieux migrés`);
    } else {
      console.log('✅ Aucun lieu à migrer');
    }

    // 4. Migrer les tâches
    console.log('\n4. Migration des tâches...');
    
    const tasksWithoutOrg = await prisma.task.findMany({
      where: { organizationId: null }
    });

    if (tasksWithoutOrg.length > 0) {
      await prisma.task.updateMany({
        where: { organizationId: null },
        data: { organizationId: defaultOrg.id }
      });
      console.log(`✅ ${tasksWithoutOrg.length} tâches migrées`);
    } else {
      console.log('✅ Aucune tâche à migrer');
    }

    // 5. Migrer les templates de nettoyage
    console.log('\n5. Migration des templates de nettoyage...');
    
    const cleaningTemplatesWithoutOrg = await prisma.cleaningTemplate.findMany({
      where: { organizationId: null }
    });

    if (cleaningTemplatesWithoutOrg.length > 0) {
      await prisma.cleaningTemplate.updateMany({
        where: { organizationId: null },
        data: { organizationId: defaultOrg.id }
      });
      console.log(`✅ ${cleaningTemplatesWithoutOrg.length} templates de nettoyage migrés`);
    } else {
      console.log('✅ Aucun template de nettoyage à migrer');
    }

    // 6. Migrer les templates de planning
    console.log('\n6. Migration des templates de planning...');
    
    const planningTemplatesWithoutOrg = await prisma.planningTemplate.findMany({
      where: { organizationId: null }
    });

    if (planningTemplatesWithoutOrg.length > 0) {
      await prisma.planningTemplate.updateMany({
        where: { organizationId: null },
        data: { organizationId: defaultOrg.id }
      });
      console.log(`✅ ${planningTemplatesWithoutOrg.length} templates de planning migrés`);
    } else {
      console.log('✅ Aucun template de planning à migrer');
    }

    // 7. Créer un Super Admin
    console.log('\n7. Création d\'un Super Admin...');
    
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!existingSuperAdmin) {
      // Chercher un admin existant pour le promouvoir
      const existingAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (existingAdmin) {
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: 'SUPER_ADMIN' }
        });
        console.log(`✅ ${existingAdmin.name} promu Super Admin`);
      } else {
        console.log('⚠️  Aucun admin trouvé à promouvoir. Créez un Super Admin manuellement.');
      }
    } else {
      console.log(`✅ Super Admin existe déjà : ${existingSuperAdmin.name}`);
    }

    // 8. Afficher le résumé
    console.log('\n📊 Résumé de la migration :');
    
    const stats = await prisma.organization.findUnique({
      where: { id: defaultOrg.id },
      include: {
        _count: {
          select: {
            users: true,
            locations: true,
            tasks: true,
            cleaningTemplates: true,
            planningTemplates: true
          }
        }
      }
    });

    console.log(`🏢 Organisation : ${stats?.name}`);
    console.log(`👥 Utilisateurs : ${stats?._count.users}`);
    console.log(`📍 Lieux : ${stats?._count.locations}`);
    console.log(`📋 Tâches : ${stats?._count.tasks}`);
    console.log(`🧹 Templates nettoyage : ${stats?._count.cleaningTemplates}`);
    console.log(`📅 Templates planning : ${stats?._count.planningTemplates}`);

    console.log('\n🎉 Migration terminée avec succès !');
    console.log('\n💡 Prochaines étapes :');
    console.log('1. Tester l\'application avec l\'organisation par défaut');
    console.log('2. Créer de nouvelles organisations pour d\'autres clients');
    console.log('3. Mettre à jour les controllers pour filtrer par organisation');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  migrateToMultiTenant();
}

export default migrateToMultiTenant;