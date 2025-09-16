import { PrismaClient } from '@prisma/client'

// Database-specific test setup
let prisma

beforeAll(async () => {
  // Use test database URL
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test_user:test_pass@localhost:5432/tbat_test'
  
  prisma = new PrismaClient()
  
  // Ensure test database is ready
  try {
    await prisma.$connect()
    console.log('✅ Test database connected successfully')
  } catch (error) {
    console.error('❌ Test database connection failed:', error.message)
    throw error
  }
})

beforeEach(async () => {
  // Clean database before each test
  const tablenames = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables 
    WHERE schemaname='public'
  `
  
  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`)
    }
  }
})

afterAll(async () => {
  await prisma.$disconnect()
  console.log('✅ Test database disconnected')
})

// Make prisma available globally in tests
global.testPrisma = prisma