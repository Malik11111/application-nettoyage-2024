import { PrismaClient } from '@prisma/client';
import { TimeSlot } from '../types';

const prisma = new PrismaClient();

export interface LocationData {
  name: string;
  description?: string;
  floor: string;
  type: string;
  surface: number;
  cleaningCoefficient: number;
}

export interface TemplateData {
  name: string;
  description: string;
  agentEmail: string;
  timeSlots: TimeSlot[];
}

// Calcul automatique de la durée basé sur la surface
export const calculateDuration = (surface: number, coefficient: number = 1.2): number => {
  return Math.ceil(surface * coefficient);
};

// Générateur de template Nassima RDC
export const generateNassimaTemplate = async (): Promise<void> => {
  try {
    // Vérifier si l'agent Nassima existe, sinon le créer
    let nassima = await prisma.user.findUnique({
      where: { email: 'nassima@cleaning.com' }
    });

    if (!nassima) {
      nassima = await prisma.user.create({
        data: {
          email: 'nassima@cleaning.com',
          name: 'Nassima',
          role: 'AGENT',
          password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
        }
      });
      console.log('Agent Nassima créé');
    }

    // Définir les lieux avec leurs surfaces
    const locations: LocationData[] = [
      // Priorité matinale (7h00-9h00)
      { name: 'Infirmerie', description: 'Salle d\'infirmerie - priorité matinale', floor: 'RDC', type: 'infirmerie', surface: 15, cleaningCoefficient: 1.3 },
      { name: 'Classe 1', description: 'Salle de classe 1 - priorité matinale', floor: 'RDC', type: 'classe', surface: 25, cleaningCoefficient: 1.0 },
      { name: 'Classe 2', description: 'Salle de classe 2 - priorité matinale', floor: 'RDC', type: 'classe', surface: 25, cleaningCoefficient: 1.0 },
      { name: 'Classe 3', description: 'Salle de classe 3 - priorité matinale', floor: 'RDC', type: 'classe', surface: 25, cleaningCoefficient: 1.0 },
      { name: 'Classe 4', description: 'Salle de classe 4 - priorité matinale', floor: 'RDC', type: 'classe', surface: 25, cleaningCoefficient: 1.0 },
      { name: 'Sanitaires', description: 'Sanitaires - priorité matinale', floor: 'RDC', type: 'sanitaire', surface: 20, cleaningCoefficient: 1.5 },
      
      // Matinée (9h00-11h00)
      { name: 'Bureau Médecin', description: 'Bureau du médecin', floor: 'RDC', type: 'bureau', surface: 12, cleaningCoefficient: 1.2 },
      { name: 'Bureau Secrétaire', description: 'Bureau de la secrétaire', floor: 'RDC', type: 'bureau', surface: 10, cleaningCoefficient: 1.2 },
      { name: 'Bureau Psychologue', description: 'Bureau du psychologue', floor: 'RDC', type: 'bureau', surface: 12, cleaningCoefficient: 1.2 },
      
      // Ateliers libres (12h00-13h30)
      { name: 'Atelier Restauration', description: 'Atelier de restauration', floor: 'RDC', type: 'atelier', surface: 30, cleaningCoefficient: 1.4 },
      { name: 'Atelier HEL', description: 'Atelier HEL', floor: 'RDC', type: 'atelier', surface: 25, cleaningCoefficient: 1.3 },
      { name: 'Atelier Horticulture', description: 'Atelier d\'horticulture', floor: 'RDC', type: 'atelier', surface: 35, cleaningCoefficient: 1.5 },
      { name: 'Atelier Bois', description: 'Atelier bois', floor: 'RDC', type: 'atelier', surface: 40, cleaningCoefficient: 1.4 },
    ];

    // Créer les lieux s'ils n'existent pas
    const createdLocations = [];
    for (const locationData of locations) {
      let location = await prisma.location.findFirst({
        where: { 
          name: locationData.name,
          floor: locationData.floor
        }
      });

      if (!location) {
        location = await prisma.location.create({
          data: locationData
        });
        console.log(`Lieu créé: ${location.name}`);
      } else {
        // Mettre à jour avec les nouvelles propriétés si nécessaire
        location = await prisma.location.update({
          where: { id: location.id },
          data: {
            surface: locationData.surface,
            cleaningCoefficient: locationData.cleaningCoefficient
          }
        });
        console.log(`Lieu mis à jour: ${location.name}`);
      }
      createdLocations.push(location);
    }

    // Définir les créneaux horaires avec les lieux
    const timeSlots: TimeSlot[] = [
      {
        startTime: '07:00',
        endTime: '09:00',
        period: 'morning',
        locations: [
          { locationId: createdLocations.find(l => l.name === 'Infirmerie')!.id, estimatedDuration: calculateDuration(15, 1.3) },
          { locationId: createdLocations.find(l => l.name === 'Classe 1')!.id, estimatedDuration: calculateDuration(25, 1.0) },
          { locationId: createdLocations.find(l => l.name === 'Classe 2')!.id, estimatedDuration: calculateDuration(25, 1.0) },
          { locationId: createdLocations.find(l => l.name === 'Classe 3')!.id, estimatedDuration: calculateDuration(25, 1.0) },
          { locationId: createdLocations.find(l => l.name === 'Classe 4')!.id, estimatedDuration: calculateDuration(25, 1.0) },
          { locationId: createdLocations.find(l => l.name === 'Sanitaires')!.id, estimatedDuration: calculateDuration(20, 1.5) },
        ]
      },
      {
        startTime: '09:00',
        endTime: '11:00',
        period: 'morning',
        locations: [
          { locationId: createdLocations.find(l => l.name === 'Bureau Médecin')!.id, estimatedDuration: calculateDuration(12, 1.2) },
          { locationId: createdLocations.find(l => l.name === 'Bureau Secrétaire')!.id, estimatedDuration: calculateDuration(10, 1.2) },
          { locationId: createdLocations.find(l => l.name === 'Bureau Psychologue')!.id, estimatedDuration: calculateDuration(12, 1.2) },
        ]
      },
      {
        startTime: '12:00',
        endTime: '13:30',
        period: 'midday',
        locations: [
          { locationId: createdLocations.find(l => l.name === 'Atelier Restauration')!.id, estimatedDuration: calculateDuration(30, 1.4) },
          { locationId: createdLocations.find(l => l.name === 'Atelier HEL')!.id, estimatedDuration: calculateDuration(25, 1.3) },
          { locationId: createdLocations.find(l => l.name === 'Atelier Horticulture')!.id, estimatedDuration: calculateDuration(35, 1.5) },
          { locationId: createdLocations.find(l => l.name === 'Atelier Bois')!.id, estimatedDuration: calculateDuration(40, 1.4) },
        ]
      }
    ];

    // Créer le template
    let template = await prisma.cleaningTemplate.findFirst({
      where: { 
        name: 'Planning Nassima RDC',
        agentId: nassima.id
      }
    });

    if (!template) {
      template = await prisma.cleaningTemplate.create({
        data: {
          name: 'Planning Nassima RDC',
          description: 'Planning personnalisé pour Nassima - RDC - Horaires 7h00-15h30 avec pause 11h-12h',
          agentId: nassima.id,
          timeSlots: JSON.stringify(timeSlots),
          isActive: true
        }
      });
      console.log('Template Nassima créé');
    } else {
      template = await prisma.cleaningTemplate.update({
        where: { id: template.id },
        data: {
          timeSlots: JSON.stringify(timeSlots)
        }
      });
      console.log('Template Nassima mis à jour');
    }

    return template;
  } catch (error) {
    console.error('Erreur lors de la génération du template Nassima:', error);
    throw error;
  }
};

// Générateur de tâches pour une date donnée à partir d'un template
export const generateTasksFromTemplate = async (templateId: string, date: Date): Promise<any[]> => {
  try {
    const template = await prisma.cleaningTemplate.findUnique({
      where: { id: templateId },
      include: { agent: true }
    });

    if (!template) {
      throw new Error('Template not found');
    }

    const timeSlots: TimeSlot[] = JSON.parse(template.timeSlots);
    const tasks = [];

    // Supprimer les tâches existantes pour cette date et cet agent (si récurrentes)
    await prisma.task.deleteMany({
      where: {
        assignedAgentId: template.agentId,
        templateId: templateId,
        scheduledDate: {
          gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
        }
      }
    });

    // Générer les nouvelles tâches
    for (const slot of timeSlots) {
      for (const locationTask of slot.locations) {
        const location = await prisma.location.findUnique({
          where: { id: locationTask.locationId }
        });

        if (!location) continue;

        const task = await prisma.task.create({
          data: {
            title: `Nettoyage ${location.name}`,
            description: `Nettoyage ${slot.period === 'morning' ? 'matinal' : slot.period === 'midday' ? 'de midi' : 'après-midi'} - ${location.type}`,
            locationId: location.id,
            assignedAgentId: template.agentId,
            priority: slot.period === 'morning' && ['Infirmerie', 'Sanitaires'].includes(location.name) ? 'HIGH' : 'MEDIUM',
            estimatedDuration: locationTask.estimatedDuration,
            scheduledDate: date,
            scheduledTime: slot.startTime,
            isRecurring: true,
            templateId: templateId,
            status: 'PENDING'
          },
          include: {
            location: true,
            assignedAgent: {
              select: { id: true, name: true, email: true }
            }
          }
        });

        tasks.push(task);
      }
    }

    console.log(`${tasks.length} tâches générées pour ${template.agent?.name} le ${date.toLocaleDateString()}`);
    return tasks;

  } catch (error) {
    console.error('Erreur lors de la génération des tâches:', error);
    throw error;
  }
};

// Fonction pour générer automatiquement le planning de la semaine
export const generateWeeklyTasks = async (templateId: string, startDate: Date): Promise<any[]> => {
  const allTasks = [];
  
  // Générer pour 5 jours ouvrables
  for (let i = 0; i < 5; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + i);
    
    // Éviter les weekends
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      const tasks = await generateTasksFromTemplate(templateId, currentDate);
      allTasks.push(...tasks);
    }
  }
  
  return allTasks;
};