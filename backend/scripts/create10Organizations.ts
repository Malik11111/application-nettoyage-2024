import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function create10Organizations() {
  console.log('🏢 Création de 10 établissements...');

  try {
    // Supprimer les organisations existantes (sauf celle par défaut)
    await prisma.user.deleteMany({
      where: {
        email: {
          not: 'admin@cleaning.com'
        }
      }
    });

    await prisma.organization.deleteMany({
      where: {
        id: {
          not: 'org_default'
        }
      }
    });

    // Créer 10 établissements
    for (let i = 1; i <= 10; i++) {
      const org = await prisma.organization.create({
        data: {
          name: `Établissement ${i}`,
          slug: `etablissement-${i}`,
          contactEmail: `contact@etablissement${i}.com`,
          contactPhone: `+33 1 ${i}0 00 00 00`,
          address: `${i}0 Rue de l'Établissement ${i}, 7500${i} Paris`,
          subscriptionPlan: 'standard',
          isActive: true
        }
      });

      // Créer admin pour cet établissement
      await prisma.user.create({
        data: {
          name: `Admin ${i}`,
          email: `admin${i}@etablissement.com`,
          password: await bcrypt.hash('123456', 10),
          role: 'ADMIN',
          organizationId: org.id
        }
      });

      // Créer 2 agents pour cet établissement
      await prisma.user.create({
        data: {
          name: `Agent ${i}A`,
          email: `agent${i}a@etablissement.com`,
          password: await bcrypt.hash('123456', 10),
          role: 'AGENT',
          organizationId: org.id
        }
      });

      await prisma.user.create({
        data: {
          name: `Agent ${i}B`,
          email: `agent${i}b@etablissement.com`,
          password: await bcrypt.hash('123456', 10),
          role: 'AGENT',
          organizationId: org.id
        }
      });

      console.log(`✅ Établissement ${i} créé avec admin et agents`);
    }

    console.log('🎉 10 établissements créés !');
    console.log('');
    console.log('📧 TOUS LES COMPTES (mot de passe: 123456):');
    console.log('');
    console.log('🔱 SUPER_ADMIN:');
    console.log('admin@cleaning.com');
    console.log('');
    console.log('🏢 ÉTABLISSEMENTS:');
    for (let i = 1; i <= 10; i++) {
      console.log(`Établissement ${i}:`);
      console.log(`  admin${i}@etablissement.com`);
      console.log(`  agent${i}a@etablissement.com`);
      console.log(`  agent${i}b@etablissement.com`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

create10Organizations();