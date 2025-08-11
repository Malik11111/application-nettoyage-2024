const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkImpOrg() {
  try {
    const org = await prisma.organization.findUnique({
      where: { slug: 'imp' },
      include: {
        users: {
          select: {
            email: true,
            name: true,
            role: true,
            createdAt: true
          }
        },
        locations: {
          select: {
            name: true,
            floor: true,
            createdAt: true
          }
        },
        tasks: {
          select: {
            title: true,
            status: true,
            assignedAgent: {
              select: {
                name: true,
                email: true
              }
            },
            createdAt: true
          }
        }
      }
    });

    if (!org) {
      console.log('❌ Organisation "imp" non trouvée');
      return;
    }

    console.log(`🏢 Organisation: ${org.name} (${org.slug})`);
    console.log(`📅 Créée: ${new Date(org.createdAt).toLocaleString('fr-FR')}\n`);

    console.log('👥 UTILISATEURS:');
    org.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      console.log(`   📅 Créé: ${new Date(user.createdAt).toLocaleString('fr-FR')}`);
    });

    console.log('\n📍 LIEUX:');
    org.locations.forEach((location, index) => {
      console.log(`${index + 1}. ${location.name} - Étage: ${location.floor}`);
      console.log(`   📅 Créé: ${new Date(location.createdAt).toLocaleString('fr-FR')}`);
    });

    console.log('\n✅ TÂCHES:');
    org.tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${task.title} - Status: ${task.status}`);
      console.log(`   👤 Assignée à: ${task.assignedAgent?.name || 'Non assignée'}`);
      console.log(`   📅 Créée: ${new Date(task.createdAt).toLocaleString('fr-FR')}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkImpOrg();