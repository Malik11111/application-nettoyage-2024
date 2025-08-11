import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestOrganizations() {
  console.log('🏢 Création des organisations de test...');

  try {
    // 1. Créer l'organisation "Hôtel Luxe Paris"
    const hotelLuxe = await prisma.organization.create({
      data: {
        name: 'Hôtel Luxe Paris',
        slug: 'hotel-luxe-paris',
        domain: 'hotel-luxe-paris.com',
        contactEmail: 'contact@hotel-luxe-paris.com',
        contactPhone: '+33 1 42 00 00 00',
        address: '123 Avenue des Champs-Élysées, 75008 Paris',
        subscriptionPlan: 'premium',
        isActive: true
      }
    });
    console.log('✅ Hôtel Luxe Paris créé:', hotelLuxe.id);

    // 2. Créer l'organisation "Clinique Saint-Antoine"
    const clinique = await prisma.organization.create({
      data: {
        name: 'Clinique Saint-Antoine',
        slug: 'clinique-saint-antoine',
        domain: 'clinique-saint-antoine.fr',
        contactEmail: 'admin@clinique-saint-antoine.fr',
        contactPhone: '+33 1 45 00 00 00',
        address: '456 Rue de la Santé, 75014 Paris',
        subscriptionPlan: 'standard',
        isActive: true
      }
    });
    console.log('✅ Clinique Saint-Antoine créée:', clinique.id);

    // 3. Créer l'organisation "Bureau Central"
    const bureauCentral = await prisma.organization.create({
      data: {
        name: 'Bureau Central',
        slug: 'bureau-central',
        domain: 'bureau-central.com',
        contactEmail: 'direction@bureau-central.com',
        contactPhone: '+33 1 40 00 00 00',
        address: '789 Boulevard Haussmann, 75009 Paris',
        subscriptionPlan: 'basic',
        isActive: true
      }
    });
    console.log('✅ Bureau Central créé:', bureauCentral.id);

    // 4. Créer des utilisateurs pour chaque organisation
    
    // Admin Hôtel Luxe Paris
    const adminHotel = await prisma.user.create({
      data: {
        name: 'Marie Dubois',
        email: 'admin@hotel-luxe-paris.com',
        password: await bcrypt.hash('123456', 10),
        role: 'ADMIN',
        organizationId: hotelLuxe.id
      }
    });
    console.log('✅ Admin Hôtel créé:', adminHotel.email);

    // Admin Clinique
    const adminClinique = await prisma.user.create({
      data: {
        name: 'Dr. Jean Martin',
        email: 'admin@clinique-saint-antoine.fr',
        password: await bcrypt.hash('123456', 10),
        role: 'ADMIN',
        organizationId: clinique.id
      }
    });
    console.log('✅ Admin Clinique créé:', adminClinique.email);

    // Admin Bureau Central
    const adminBureau = await prisma.user.create({
      data: {
        name: 'Paul Bernard',
        email: 'admin@bureau-central.com',
        password: await bcrypt.hash('123456', 10),
        role: 'ADMIN',
        organizationId: bureauCentral.id
      }
    });
    console.log('✅ Admin Bureau créé:', adminBureau.email);

    // 5. Créer quelques agents pour chaque organisation
    
    // Agents Hôtel
    await prisma.user.create({
      data: {
        name: 'Sophie Léger',
        email: 'sophie@hotel-luxe-paris.com',
        password: await bcrypt.hash('123456', 10),
        role: 'AGENT',
        organizationId: hotelLuxe.id
      }
    });

    await prisma.user.create({
      data: {
        name: 'Thomas Petit',
        email: 'thomas@hotel-luxe-paris.com',
        password: await bcrypt.hash('123456', 10),
        role: 'AGENT',
        organizationId: hotelLuxe.id
      }
    });

    // Agents Clinique
    await prisma.user.create({
      data: {
        name: 'Fatima Ben Ali',
        email: 'fatima@clinique-saint-antoine.fr',
        password: await bcrypt.hash('123456', 10),
        role: 'AGENT',
        organizationId: clinique.id
      }
    });

    // Agents Bureau
    await prisma.user.create({
      data: {
        name: 'Ahmed Koné',
        email: 'ahmed@bureau-central.com',
        password: await bcrypt.hash('123456', 10),
        role: 'AGENT',
        organizationId: bureauCentral.id
      }
    });

    console.log('🎉 Toutes les organisations de test ont été créées !');
    console.log('');
    console.log('📧 Comptes créés :');
    console.log('SUPER_ADMIN: admin@cleaning.com / 123456 (peut voir toutes les orgs)');
    console.log('');
    console.log('🏨 Hôtel Luxe Paris:');
    console.log('  ADMIN: admin@hotel-luxe-paris.com / 123456');
    console.log('  AGENT: sophie@hotel-luxe-paris.com / 123456');
    console.log('  AGENT: thomas@hotel-luxe-paris.com / 123456');
    console.log('');
    console.log('🏥 Clinique Saint-Antoine:');
    console.log('  ADMIN: admin@clinique-saint-antoine.fr / 123456');
    console.log('  AGENT: fatima@clinique-saint-antoine.fr / 123456');
    console.log('');
    console.log('🏢 Bureau Central:');
    console.log('  ADMIN: admin@bureau-central.com / 123456');
    console.log('  AGENT: ahmed@bureau-central.com / 123456');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestOrganizations();