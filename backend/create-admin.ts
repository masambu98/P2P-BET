import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@yourdomain.com',
        username: 'admin',
        passwordHash: hash,
        role: 'ADMIN',
        isVerified: true,
        isActive: true
      }
    });
    console.log('Admin user created!');
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
