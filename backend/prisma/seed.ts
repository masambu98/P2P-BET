import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting REAL MONEY P2P Betting Platform seeding...');

  // Create admin user with 0 balance (real money mode)
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yourdomain.com' },
    update: {},
    create: {
      email: 'admin@yourdomain.com',
      username: 'admin',
      passwordHash: adminPassword,
      isAdmin: true,
      isEmailVerified: true,
      isActive: true,
      kycStatus: 'verified'
    }
  });

  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      balance: 0.00, // Start with 0 for real money mode
      currency: 'KES'
    }
  });

  // Create demo users with 0 balance (real money mode)
  const userPassword = await bcrypt.hash('user123', 12);

  const demoUser1 = await prisma.user.upsert({
    where: { email: 'demo1@yourdomain.com' },
    update: {},
    create: {
      email: 'demo1@yourdomain.com',
      username: 'demo1',
      passwordHash: userPassword,
      isAdmin: false,
      isEmailVerified: true,
      isActive: true,
      kycStatus: 'verified'
    }
  });

  await prisma.wallet.upsert({
    where: { userId: demoUser1.id },
    update: {},
    create: {
      userId: demoUser1.id,
      balance: 0.00, // Start with 0 for real money mode
      currency: 'KES'
    }
  });

  const demoUser2 = await prisma.user.upsert({
    where: { email: 'demo2@yourdomain.com' },
    update: {},
    create: {
      email: 'demo2@yourdomain.com',
      username: 'demo2',
      passwordHash: userPassword,
      isAdmin: false,
      isEmailVerified: true,
      isActive: true,
      kycStatus: 'verified'
    }
  });

  await prisma.wallet.upsert({
    where: { userId: demoUser2.id },
    update: {},
    create: {
      userId: demoUser2.id,
      balance: 0.00, // Start with 0 for real money mode
      currency: 'KES'
    }
  });

  console.log('✅ REAL MONEY P2P Betting Platform seeded successfully!');
  console.log('');
  console.log('📱 REAL MONEY MODE - Users start with 0 KES balance');
  console.log('💳 M-Pesa PRODUCTION integration ready');
  console.log('💰 Stripe LIVE integration ready');
  console.log('');
  console.log('👤 Default Accounts:');
  console.log('   Admin: admin@yourdomain.com / admin123 (Balance: 0 KES)');
  console.log('   User 1: demo1@yourdomain.com / user123 (Balance: 0 KES)');
  console.log('   User 2: demo2@yourdomain.com / user123 (Balance: 0 KES)');
  console.log('');
  console.log('🎯 NEXT STEPS:');
  console.log('   1. Configure REAL M-Pesa production credentials in .env');
  console.log('   2. Start backend: npm run dev');
  console.log('   3. Users can now deposit REAL MONEY via M-Pesa STK Push');
  console.log('   4. Users can bet with REAL KES stakes');
  console.log('   5. Admin can settle bets and pay REAL MONEY to winners');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
