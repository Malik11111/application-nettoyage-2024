import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetAdminPassword() {
  try {
    console.log('🔄 Réinitialisation du mot de passe administrateur...\n');
    
    // Find the admin user
    const adminUser = await prisma.user.findFirst({
      where: { 
        email: 'admin@cleaning.com'
      }
    });
    
    if (!adminUser) {
      console.log('❌ Utilisateur admin@cleaning.com introuvable');
      return;
    }
    
    // Hash new password
    const newPassword = '123456';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Mot de passe réinitialisé avec succès !');
    console.log(`📧 Email: admin@cleaning.com`);
    console.log(`🔑 Mot de passe: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAdminPassword();