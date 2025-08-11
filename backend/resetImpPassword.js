const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetImpPassword() {
  try {
    // Find the imp organization first
    const impOrg = await prisma.organization.findUnique({
      where: { slug: 'imp' }
    });

    if (!impOrg) {
      console.log('❌ Organisation "imp" non trouvée');
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Update the admin user password
    const updatedUser = await prisma.user.updateMany({
      where: {
        email: 'imp@gmail.com',
        organizationId: impOrg.id
      },
      data: {
        password: hashedPassword
      }
    });

    if (updatedUser.count > 0) {
      console.log('✅ Mot de passe mis à jour !');
      console.log('📧 Email: imp@gmail.com');
      console.log('🔑 Nouveau mot de passe: 123456');
    } else {
      console.log('❌ Utilisateur non trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetImpPassword();