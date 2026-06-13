const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user (will be synced from Google OAuth but we need a placeholder)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@college.edu' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@college.edu',
      name: 'Admin User',
      role: 'ADMIN',
      profileCompleted: true,
      hostel: 'Admin Office',
      registrationNo: 'ADMIN001',
    },
  });
  console.log(`✓ Admin user: ${admin.email}`);

  // Create sample students
  const students = [
    { email: 'student1@college.edu', name: 'Arjun Kumar', registrationNo: '21BCE1001', hostel: 'Hostel A' },
    { email: 'student2@college.edu', name: 'Priya Sharma', registrationNo: '21BCE1002', hostel: 'Girls Hostel 1' },
    { email: 'student3@college.edu', name: 'Rahul Verma', registrationNo: '21BCE1003', hostel: 'Hostel C' },
  ];

  for (const s of students) {
    const student = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        ...s,
        role: 'STUDENT',
        profileCompleted: true,
      },
    });
    console.log(`✓ Student: ${student.email}`);
  }

  // Create sample agent
  const agentUser = await prisma.user.upsert({
    where: { email: 'agent1@college.edu' },
    update: {},
    create: {
      email: 'agent1@college.edu',
      name: 'Vikram Singh',
      registrationNo: '21BCE2001',
      hostel: 'Hostel B',
      role: 'AGENT',
      profileCompleted: true,
    },
  });

  const agent = await prisma.agent.upsert({
    where: { userId: agentUser.id },
    update: {},
    create: {
      userId: agentUser.id,
      status: 'APPROVED',
      deliveryCount: 0,
      avgRating: 0,
      totalRatings: 0,
    },
  });
  console.log(`✓ Agent: ${agentUser.email} (${agent.status})`);

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
