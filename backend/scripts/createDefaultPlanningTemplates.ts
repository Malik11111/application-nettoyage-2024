import { PrismaClient } from '@prisma/client';
import { LocationConfig } from '../src/types';

const prisma = new PrismaClient();

const createDefaultTemplates = async () => {
  try {
    // Get all locations for reference
    const locations = await prisma.location.findMany();
    const infirmerie = locations.find(l => l.type === 'infirmerie');
    const classes = locations.filter(l => l.type === 'classe');
    const sanitaires = locations.filter(l => l.type === 'sanitaire');
    const bureaux = locations.filter(l => l.type === 'bureau');
    const ateliers = locations.filter(l => l.type === 'atelier');

    // Get admin user for template creation
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }

    console.log('Creating default planning templates...');

    // Template 1: Nassima RDC (based on existing successful planning)
    if (infirmerie && classes.length > 0 && sanitaires.length > 0 && bureaux.length > 0 && ateliers.length > 0) {
      const nassimaLocations: LocationConfig[] = [
        {
          locationId: infirmerie.id,
          priority: 1,
          timeSlot: 'morning',
          estimatedDuration: 20,
        },
        // Classes - priority matinale
        ...classes.slice(0, 4).map((classe, index) => ({
          locationId: classe.id,
          priority: index + 2,
          timeSlot: 'beforeBreak' as const,
          estimatedDuration: 15,
        })),
        // Premier passage sanitaires
        {
          locationId: sanitaires[0].id,
          priority: 6,
          timeSlot: 'beforeBreak',
          estimatedDuration: 30,
        },
        // Bureaux
        ...bureaux.slice(0, 4).map((bureau, index) => ({
          locationId: bureau.id,
          priority: index + 7,
          timeSlot: 'beforeBreak' as const,
          estimatedDuration: 10,
        })),
        // Ateliers après pause
        ...ateliers.slice(0, 3).map((atelier, index) => ({
          locationId: atelier.id,
          priority: index + 11,
          timeSlot: 'afterBreak' as const,
          estimatedDuration: 30,
        })),
        // Deuxième passage sanitaires
        {
          locationId: sanitaires[1] ? sanitaires[1].id : sanitaires[0].id,
          priority: 14,
          timeSlot: 'afternoon',
          estimatedDuration: 30,
        }
      ];

      await prisma.planningTemplate.create({
        data: {
          name: 'Template Nassima RDC',
          description: 'Template basé sur le planning parfait de Nassima - RDC complet avec priorisation matinale',
          workStart: '07:00',
          workEnd: '15:30',
          breakStart: '11:00',
          breakEnd: '12:00',
          locations: JSON.stringify(nassimaLocations),
          isDefault: true,
          createdBy: adminUser.id,
        }
      });
      console.log('✅ Template Nassima RDC créé');
    }

    // Template 2: Standard Agent
    const standardLocations: LocationConfig[] = [];
    let priority = 1;

    // Infirmerie en priorité si disponible
    if (infirmerie) {
      standardLocations.push({
        locationId: infirmerie.id,
        priority: priority++,
        timeSlot: 'morning',
        estimatedDuration: 20,
      });
    }

    // Quelques classes
    classes.slice(0, 2).forEach(classe => {
      standardLocations.push({
        locationId: classe.id,
        priority: priority++,
        timeSlot: 'beforeBreak',
        estimatedDuration: 15,
      });
    });

    // Sanitaires
    if (sanitaires.length > 0) {
      standardLocations.push({
        locationId: sanitaires[0].id,
        priority: priority++,
        timeSlot: 'beforeBreak',
        estimatedDuration: 30,
      });
    }

    // Quelques bureaux
    bureaux.slice(0, 2).forEach(bureau => {
      standardLocations.push({
        locationId: bureau.id,
        priority: priority++,
        timeSlot: 'afterBreak',
        estimatedDuration: 10,
      });
    });

    // Un atelier
    if (ateliers.length > 0) {
      standardLocations.push({
        locationId: ateliers[0].id,
        priority: priority++,
        timeSlot: 'afternoon',
        estimatedDuration: 25,
      });
    }

    await prisma.planningTemplate.create({
      data: {
        name: 'Template Standard',
        description: 'Planning générique pour nouveaux agents - couverture basique de tous types de lieux',
        workStart: '08:00',
        workEnd: '15:00',
        breakStart: '11:30',
        breakEnd: '12:30',
        locations: JSON.stringify(standardLocations),
        isDefault: true,
        createdBy: adminUser.id,
      }
    });
    console.log('✅ Template Standard créé');

    // Template 3: Étage (si applicable)
    const etageLocations: LocationConfig[] = [];
    priority = 1;

    // Classes d'étage en priorité
    classes.slice(2, 5).forEach(classe => {
      etageLocations.push({
        locationId: classe.id,
        priority: priority++,
        timeSlot: 'morning',
        estimatedDuration: 15,
      });
    });

    // Bureaux d'étage
    bureaux.slice(2, 4).forEach(bureau => {
      etageLocations.push({
        locationId: bureau.id,
        priority: priority++,
        timeSlot: 'beforeBreak',
        estimatedDuration: 10,
      });
    });

    // Sanitaires d'étage
    if (sanitaires.length > 1) {
      etageLocations.push({
        locationId: sanitaires[1].id,
        priority: priority++,
        timeSlot: 'afternoon',
        estimatedDuration: 30,
      });
    }

    if (etageLocations.length > 0) {
      await prisma.planningTemplate.create({
        data: {
          name: 'Template Étage',
          description: 'Planning optimisé pour agents travaillant principalement à l\'étage',
          workStart: '07:30',
          workEnd: '15:00',
          breakStart: '11:00',
          breakEnd: '12:00',
          locations: JSON.stringify(etageLocations),
          isDefault: true,
          createdBy: adminUser.id,
        }
      });
      console.log('✅ Template Étage créé');
    }

    // Template 4: Planning Intensif
    const intensifLocations: LocationConfig[] = [];
    priority = 1;

    // Utilise tous les lieux disponibles avec un planning chargé
    [infirmerie].filter(Boolean).forEach(loc => {
      intensifLocations.push({
        locationId: loc!.id,
        priority: priority++,
        timeSlot: 'morning',
        estimatedDuration: 20,
      });
    });

    classes.forEach(classe => {
      intensifLocations.push({
        locationId: classe.id,
        priority: priority++,
        timeSlot: 'beforeBreak',
        estimatedDuration: 12,
      });
    });

    sanitaires.forEach(sanitaire => {
      intensifLocations.push({
        locationId: sanitaire.id,
        priority: priority++,
        timeSlot: priority % 2 === 0 ? 'beforeBreak' : 'afternoon',
        estimatedDuration: 25,
      });
    });

    bureaux.forEach(bureau => {
      intensifLocations.push({
        locationId: bureau.id,
        priority: priority++,
        timeSlot: 'afterBreak',
        estimatedDuration: 8,
      });
    });

    ateliers.forEach(atelier => {
      intensifLocations.push({
        locationId: atelier.id,
        priority: priority++,
        timeSlot: 'afternoon',
        estimatedDuration: 20,
      });
    });

    if (intensifLocations.length > 0) {
      await prisma.planningTemplate.create({
        data: {
          name: 'Template Intensif',
          description: 'Planning complet et intensif couvrant tous les lieux - pour agents expérimentés',
          workStart: '07:00',
          workEnd: '16:00',
          breakStart: '11:30',
          breakEnd: '12:30',
          locations: JSON.stringify(intensifLocations),
          isDefault: false,
          createdBy: adminUser.id,
        }
      });
      console.log('✅ Template Intensif créé');
    }

    console.log('\n🎉 Templates par défaut créés avec succès !');
    console.log('Les administrateurs peuvent maintenant utiliser ces templates pour générer des plannings automatiquement.');
    
  } catch (error) {
    console.error('Error creating default templates:', error);
  } finally {
    await prisma.$disconnect();
  }
};

// Run if called directly
if (require.main === module) {
  createDefaultTemplates();
}

export default createDefaultTemplates;