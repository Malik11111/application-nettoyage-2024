import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔱 Création du Super Administrateur...\n');

    // 1. Créer l'organisation par défaut si elle n'existe pas
    const defaultOrg = await prisma.organization.upsert({
      where: { slug: 'admin-default' },
      update: {},
      create: {
        id: 'org_super_admin',
        name: 'Administration Générale',
        slug: 'admin-default',
        contactEmail: 'admin@cleaning.com',
        subscriptionPlan: 'premium',
        isActive: true
      }
    });

    console.log('✅ Organisation par défaut créée:', defaultOrg.name);

    // 2. Créer le Super Admin
    const hashedPassword = await bcrypt.hash('123456', 10);

    const superAdmin = await prisma.user.upsert({
      where: { 
        email_organizationId: {
          email: 'admin@cleaning.com',
          organizationId: defaultOrg.id
        }
      },
      update: {
        password: hashedPassword,
        role: 'SUPER_ADMIN'
      },
      create: {
        email: 'admin@cleaning.com',
        password: hashedPassword,
        name: 'Super Administrateur',
        role: 'SUPER_ADMIN',
        organizationId: defaultOrg.id
      }
    });

    console.log('✅ Super Administrateur créé !');
    console.log(`📧 Email: ${superAdmin.email}`);
    console.log(`🔑 Mot de passe: 123456`);
    console.log(`👑 Rôle: ${superAdmin.role}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();