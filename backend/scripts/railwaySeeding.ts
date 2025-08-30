import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedRailway() {
  try {
    console.log('🌱 Seeding Railway database...');

    // Créer l'organisation par défaut
    const defaultOrg = await prisma.organization.upsert({
      where: { slug: 'default-org' },
      update: {},
      create: {
        name: 'Organisation Par Défaut',
        slug: 'default-org',
        subscriptionPlan: 'premium',
        isActive: true
      }
    });

    console.log('✅ Organisation créée:', defaultOrg.name);

    // Hasher les mots de passe
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Créer le Super Admin
    const superAdmin = await prisma.user.upsert({
      where: { 
        email_organizationId: {
          email: 'admin@cleaning.com',
          organizationId: defaultOrg.id
        }
      },
      update: {},
      create: {
        email: 'admin@cleaning.com',
        password: hashedPassword,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        organizationId: defaultOrg.id
      }
    });

    console.log('✅ Super Admin créé:', superAdmin.email);

    // Créer l'admin d'établissement
    const admin1 = await prisma.user.upsert({
      where: { 
        email_organizationId: {
          email: 'admin1@etablissement.com',
          organizationId: defaultOrg.id
        }
      },
      update: {},
      create: {
        email: 'admin1@etablissement.com',
        password: hashedPassword,
        name: 'Admin Établissement 1',
        role: 'ADMIN',
        organizationId: defaultOrg.id
      }
    });

    console.log('✅ Admin créé:', admin1.email);

    // Créer l'agent
    const agent1 = await prisma.user.upsert({
      where: { 
        email_organizationId: {
          email: 'agent1a@etablissement.com',
          organizationId: defaultOrg.id
        }
      },
      update: {},
      create: {
        email: 'agent1a@etablissement.com',
        password: hashedPassword,
        name: 'Agent 1A',
        role: 'AGENT',
        organizationId: defaultOrg.id
      }
    });

    console.log('✅ Agent créé:', agent1.email);

    // Créer quelques lieux
    const location1 = await prisma.location.create({
      data: {
        name: 'Bureau Principal',
        description: 'Bureau principal de l\'établissement',
        floor: 'RDC',
        type: 'OFFICE',
        surface: 100,
        cleaningCoefficient: 1.0,
        organizationId: defaultOrg.id
      }
    });

    console.log('✅ Lieu créé:', location1.name);

    console.log('🎉 Seeding terminé avec succès !');
    console.log('');
    console.log('🔑 Comptes créés :');
    console.log('- Super Admin: admin@cleaning.com / 123456');
    console.log('- Admin: admin1@etablissement.com / 123456'); 
    console.log('- Agent: agent1a@etablissement.com / 123456');

  } catch (error) {
    console.error('❌ Erreur durant le seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  seedRailway()
    .then(() => {
      console.log('✅ Script terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script échoué:', error);
      process.exit(1);
    });
}

export default seedRailway;