import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  
  // Find an existing SUPER_ADMIN
  let user = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash }
    });
    console.log(`\n✅ Success! The password for your SUPER_ADMIN account (${user.email}) is now set to: admin123`);
    return;
  }

  // If no SUPER_ADMIN exists, just grab the first user and make them SUPER_ADMIN
  user = await prisma.user.findFirst();
  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hash, role: 'SUPER_ADMIN' }
    });
    console.log(`\n✅ Success! Made ${user.email} a SUPER_ADMIN and set password to: admin123`);
    return;
  }

  // If database is completely empty, create a dummy admin
  user = await prisma.user.create({
    data: {
      email: 'owner@youtube-lexify.com',
      password: hash,
      role: 'SUPER_ADMIN',
      name: 'Owner',
    }
  });
  console.log(`\n✅ Success! Created new admin account:\nEmail: ${user.email}\nPassword: admin123`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
