import { PrismaClient } from '@prisma/client';
import bcryptjs from 'bcryptjs';

// URL de la base de données Railway PostgreSQL
const RAILWAY_DB_URL = "postgresql://postgres:YUTdePJhJPOsYdJNQxzfJUHxQiOAMKoD@junction.proxy.rlwy.net:11738/railway";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: RAILWAY_DB_URL
    }
  }
});

async function updateSuperAdminPassword() {
  try {
    console.log('🔄 Connexion à la base de données Railway...');
    
    // Test de connexion
    await prisma.$connect();
    console.log('✅ Connexion établie avec Railway PostgreSQL');
    
    // Nouveau mot de passe
    const newPassword = 'Bellan2025hM@';
    
    // Hash du nouveau mot de passe
    const hashedPassword = await bcryptjs.hash(newPassword, 12);
    console.log('🔐 Mot de passe hashé généré');
    
    // Vérifier si l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@cleaning.com' }
    });
    
    if (!existingUser) {
      console.log('❌ Utilisateur admin@cleaning.com non trouvé');
      return;
    }
    
    console.log(`📧 Utilisateur trouvé: ${existingUser.email} (ID: ${existingUser.id})`);
    
    // Mettre à jour le mot de passe
    const updatedAdmin = await prisma.user.update({
      where: { email: 'admin@cleaning.com' },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Mot de passe du Super Admin mis à jour avec succès !');
    console.log(`📧 Email: ${updatedAdmin.email}`);
    console.log(`🔐 Nouveau mot de passe: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Déconnexion de la base de données');
  }
}

updateSuperAdminPassword();