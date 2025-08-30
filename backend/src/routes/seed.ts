import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Endpoint temporaire pour seeder la base de données Railway
router.get('/seed-railway', async (req, res) => {
  try {
    console.log('🌱 Starting Railway database seeding...');

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

    // Créer les utilisateurs
    const users = [
      {
        email: 'admin@cleaning.com',
        name: 'Super Admin',
        role: 'SUPER_ADMIN'
      },
      {
        email: 'admin1@etablissement.com',
        name: 'Admin Établissement 1',
        role: 'ADMIN'
      },
      {
        email: 'agent1a@etablissement.com',
        name: 'Agent 1A',
        role: 'AGENT'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = await prisma.user.upsert({
        where: { 
          email_organizationId: {
            email: userData.email,
            organizationId: defaultOrg.id
          }
        },
        update: {},
        create: {
          email: userData.email,
          password: hashedPassword,
          name: userData.name,
          role: userData.role,
          organizationId: defaultOrg.id
        }
      });

      createdUsers.push({
        email: user.email,
        name: user.name,
        role: user.role
      });

      console.log('✅ Utilisateur créé:', user.email);
    }

    // Créer un lieu
    const location = await prisma.location.upsert({
      where: {
        id: 'default-location'
      },
      update: {},
      create: {
        id: 'default-location',
        name: 'Bureau Principal',
        description: 'Bureau principal de l\'établissement',
        floor: 'RDC',
        type: 'OFFICE',
        surface: 100,
        cleaningCoefficient: 1.0,
        organizationId: defaultOrg.id
      }
    });

    console.log('✅ Lieu créé:', location.name);
    console.log('🎉 Seeding terminé avec succès !');

    res.json({
      success: true,
      message: '🎉 Railway database seeded successfully!',
      organization: {
        name: defaultOrg.name,
        slug: defaultOrg.slug
      },
      users: createdUsers,
      location: {
        name: location.name,
        floor: location.floor,
        type: location.type
      },
      instructions: {
        message: 'Vous pouvez maintenant vous connecter avec ces comptes:',
        accounts: [
          'Super Admin: admin@cleaning.com / 123456',
          'Admin: admin1@etablissement.com / 123456',
          'Agent: agent1a@etablissement.com / 123456'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Erreur durant le seeding:', error);
    res.status(500).json({
      success: false,
      message: 'Seeding failed',
      error: error.message,
      details: error.stack
    });
  }
});

export default router;