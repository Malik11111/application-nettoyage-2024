import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('📋 Utilisateurs dans la base de données:\n');
    
    const users = await prisma.user.findMany({
      include: {
        organization: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });
    
    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé dans la base de données');
      return;
    }
    
    users.forEach(user => {
      console.log(`👤 ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🏷️  Rôle: ${user.role}`);
      console.log(`   🏢 Organisation: ${user.organization?.name || 'Aucune'} (${user.organization?.slug || 'N/A'})`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();