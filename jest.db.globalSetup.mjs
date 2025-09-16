import { execSync } from 'child_process'

export default async function globalSetup() {
  console.log('🚀 Setting up test database...')
  
  try {
    // Set test database URL
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test_user:test_pass@localhost:5432/tbat_test'
    
    // Run database migrations for test environment
    console.log('📊 Running database migrations...')
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL }
    })
    
    // Generate Prisma client
    console.log('🔄 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    
    console.log('✅ Test database setup complete')
  } catch (error) {
    console.error('❌ Test database setup failed:', error.message)
    throw error
  }
}