import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

// Utiliser la base de données Railway PostgreSQL
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:YUTdePJhJPOsYdJNQxzfJUHxQiOAMKoD@junction.proxy.rlwy.net:11738/railway"
    }
  }
});

async function changeAdminPassword() {
  try {
    console.log('🔄 Changement du mot de passe Super Admin...');
    
    // Nouveau mot de passe
    const newPassword = 'Bellan2025hM@';
    
    // Hash du nouveau mot de passe
    const hashedPassword = await bcryptjs.hash(newPassword, 12);
    
    // Mettre à jour le Super Admin
    const updatedAdmin = await prisma.user.update({
      where: {
        email: 'admin@cleaning.com'
      },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('✅ Mot de passe du Super Admin changé avec succès !');
    console.log(`📧 Email: ${updatedAdmin.email}`);
    console.log(`🔐 Nouveau mot de passe: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Erreur lors du changement du mot de passe:', error);
  } finally {
    await prisma.$disconnect();
  }
}

changeAdminPassword();