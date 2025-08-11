import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializePlanningTemplates() {
  try {
    console.log('🎯 Initializing planning templates...');

    // Get admin user for createdBy field
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!admin) {
      throw new Error('No admin user found. Please create an admin user first.');
    }

    // Get all locations to use their IDs
    const locations = await prisma.location.findMany();
    const locationMap = new Map(locations.map(loc => [loc.name, loc.id]));

    console.log('📍 Found locations:', Array.from(locationMap.keys()));

    // Template Nassima RDC (based on her perfect schedule)
    const nassimaTemplate = {
      name: 'Template Nassima RDC',
      description: 'Planning parfait pour agent RDC - Infirmerie, classes, bureaux, ateliers',
      workStart: '07:00',
      workEnd: '15:30', 
      breakStart: '11:00',
      breakEnd: '12:00',
      locations: JSON.stringify([
        { locationId: locationMap.get('Infirmerie'), priority: 1, timeSlot: 'morning', estimatedDuration: 20 },
        { locationId: locationMap.get('Classe 1'), priority: 2, timeSlot: 'morning', estimatedDuration: 15 },
        { locationId: locationMap.get('Classe 2'), priority: 3, timeSlot: 'morning', estimatedDuration: 15 },
        { locationId: locationMap.get('Classe 3'), priority: 4, timeSlot: 'morning', estimatedDuration: 15 },
        { locationId: locationMap.get('Classe 4'), priority: 5, timeSlot: 'morning', estimatedDuration: 15 },
        { locationId: locationMap.get('Sanitaires'), priority: 6, timeSlot: 'beforeBreak', estimatedDuration: 30 },
        { locationId: locationMap.get('Bureau Médecin'), priority: 7, timeSlot: 'beforeBreak', estimatedDuration: 15 },
        { locationId: locationMap.get('Bureau Secrétaire'), priority: 8, timeSlot: 'beforeBreak', estimatedDuration: 12 },
        { locationId: locationMap.get('Bureau Psychologue'), priority: 9, timeSlot: 'beforeBreak', estimatedDuration: 15 },
        { locationId: locationMap.get('Atelier Restauration'), priority: 10, timeSlot: 'afterBreak', estimatedDuration: 25 },
        { locationId: locationMap.get('Atelier HEL'), priority: 11, timeSlot: 'afterBreak', estimatedDuration: 20 },
        { locationId: locationMap.get('Atelier Horticulture'), priority: 12, timeSlot: 'afterBreak', estimatedDuration: 30 },
        { locationId: locationMap.get('Atelier Bois'), priority: 13, timeSlot: 'afterBreak', estimatedDuration: 15 },
        { locationId: locationMap.get('Sanitaires'), priority: 14, timeSlot: 'afternoon', estimatedDuration: 30 }
      ]),
      createdBy: admin.id,
      isDefault: true
    };

    // Template Standard 
    const standardTemplate = {
      name: 'Template Standard',
      description: 'Planning standard pour nouveaux agents - Priorités de base',
      workStart: '08:00',
      workEnd: '16:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      locations: JSON.stringify([
        { locationId: locationMap.get('Sanitaires'), priority: 1, timeSlot: 'morning', estimatedDuration: 30 },
        { locationId: locationMap.get('Bureau Médecin'), priority: 2, timeSlot: 'morning', estimatedDuration: 15 },
        { locationId: locationMap.get('Bureau Secrétaire'), priority: 3, timeSlot: 'beforeBreak', estimatedDuration: 12 },
        { locationId: locationMap.get('Classe 1'), priority: 4, timeSlot: 'afterBreak', estimatedDuration: 20 },
        { locationId: locationMap.get('Classe 2'), priority: 5, timeSlot: 'afterBreak', estimatedDuration: 20 }
      ]),
      createdBy: admin.id,
      isDefault: false
    };

    // Check if templates already exist and create them
    const templates = [nassimaTemplate, standardTemplate];

    for (const template of templates) {
      const existing = await prisma.planningTemplate.findFirst({
        where: { name: template.name }
      });

      if (existing) {
        console.log(`📝 Updating template: ${template.name}`);
        await prisma.planningTemplate.update({
          where: { id: existing.id },
          data: {
            description: template.description,
            workStart: template.workStart,
            workEnd: template.workEnd,
            breakStart: template.breakStart,
            breakEnd: template.breakEnd,
            locations: template.locations,
            isDefault: template.isDefault
          }
        });
      } else {
        console.log(`✅ Creating template: ${template.name}`);
        await prisma.planningTemplate.create({
          data: template
        });
      }
    }

    console.log('');
    console.log('✅ Planning templates initialized successfully!');
    console.log('📋 Available templates:');
    console.log('   1. Template Nassima RDC - Perfect schedule for ground floor');
    console.log('   2. Template Standard - Basic schedule for new agents');  
    console.log('');
    console.log('🎯 Admin can now generate automatic schedules for any agent!');

  } catch (error) {
    console.error('❌ Error initializing templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializePlanningTemplates();