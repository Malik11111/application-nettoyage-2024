import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
  try {
    const email = 'nanko@gmail.com';
    const newPassword = '2202'; // Simple password for testing
    
    console.log(`🔧 Resetting password for: ${email}`);
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
      select: { email: true, name: true, role: true }
    });
    
    console.log('✅ Password reset successfully!');
    console.log(`👤 User: ${updatedUser.name} (${updatedUser.email})`);
    console.log(`🔑 New password: ${newPassword}`);
    console.log('');
    console.log('🔐 You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();