const { PrismaClient } = require('@prisma/client');
async function test(url) {
  const prisma = new PrismaClient({datasources: { db: { url } }});
  try {
    const res = await prisma.user.findFirst();
    console.log('SUCCESS with URL:', url);
    return true;
  } catch (e) {
    console.log('FAILED with URL:', url, 'Error:', e.message.split('\n')[0]);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

(async () => {
  const urls = [
    'postgresql://postgres.qobhddiwryvkaniwqpop:pONA7lKFN7VZS6JE@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    'postgresql://postgres.qobhddiwryvkaniwqpop:pONA7lKFN7VZS6JE@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    'postgresql://postgres.qobhddiwryvkaniwqpop:pONA7lKFN7VZS6JE@qobhddiwryvkaniwqpop.pooler.supabase.com:6543/postgres?pgbouncer=true',
    'postgresql://postgres.qobhddiwryvkaniwqpop:pONA7lKFN7VZS6JE@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?pgbouncer=true',
    'postgresql://postgres:pONA7lKFN7VZS6JE@qobhddiwryvkaniwqpop.pooler.supabase.com:6543/postgres?pgbouncer=true',
    'postgresql://postgres:pONA7lKFN7VZS6JE@qobhddiwryvkaniwqpop.pooler.supabase.com:5432/postgres?pgbouncer=true'
  ];
  for (const url of urls) {
    if (await test(url)) break;
  }
})();
