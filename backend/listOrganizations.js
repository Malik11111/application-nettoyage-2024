const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listOrganizations() {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            users: true,
            locations: true,
            tasks: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log(`📊 Total: ${organizations.length} organisations trouvées\n`);
    
    organizations.forEach((org, index) => {
      console.log(`${index + 1}. 🏢 ${org.name} (${org.slug})`);
      console.log(`   📧 Domaine: ${org.domain || 'N/A'}`);
      console.log(`   👥 ${org._count.users} utilisateurs`);
      console.log(`   📍 ${org._count.locations} lieux`);
      console.log(`   ✅ ${org._count.tasks} tâches`);
      console.log(`   📅 Créé: ${new Date(org.createdAt).toLocaleDateString('fr-FR')}\n`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listOrganizations();