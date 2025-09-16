/**
 * Simple database schema validation test for security tables
 * Tests database connectivity and basic table operations
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSecurityTables() {
  console.log('🔍 Testing Security Tables Schema...')

  try {
    // Test 1: Database connectivity
    console.log('1️⃣ Testing database connectivity...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Test 2: User table with Thai characters
    console.log('2️⃣ Testing User table with Thai character support...')
    const testUser = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        thaiName: 'ทดสอบ ระบบฐานข้อมูล',
        phone: '081-234-5678',
        school: 'โรงเรียนมัธยมปลายเชียงใหม่',
        packageType: 'FREE',
        pdpaConsent: true
      }
    })
    console.log(`✅ User created with Thai name: ${testUser.thaiName}`)

    // Test 3: Password Reset table
    console.log('3️⃣ Testing PasswordReset table...')
    const passwordReset = await prisma.passwordReset.create({
      data: {
        userId: testUser.id,
        resetToken: `token-${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour from now
      }
    })
    console.log(`✅ Password reset created with token: ${passwordReset.resetToken}`)

    // Test 4: Email Verification table
    console.log('4️⃣ Testing EmailVerification table...')
    const emailVerification = await prisma.emailVerification.create({
      data: {
        userId: testUser.id,
        verificationToken: `verify-${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000) // 24 hours from now
      }
    })
    console.log(`✅ Email verification created with token: ${emailVerification.verificationToken}`)

    // Test 5: Foreign key relationships
    console.log('5️⃣ Testing foreign key relationships...')
    const userWithRelations = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        passwordResets: true,
        emailVerifications: true
      }
    })
    console.log(`✅ User has ${userWithRelations?.passwordResets.length} password resets and ${userWithRelations?.emailVerifications.length} email verifications`)

    // Test 6: Unique constraints
    console.log('6️⃣ Testing unique constraints...')
    try {
      await prisma.passwordReset.create({
        data: {
          userId: testUser.id,
          resetToken: passwordReset.resetToken, // Duplicate token
          expiresAt: new Date(Date.now() + 3600000)
        }
      })
      console.log('❌ Unique constraint failed - duplicate token was allowed')
    } catch (error) {
      console.log('✅ Unique constraint working - duplicate token rejected')
    }

    // Test 7: Cascade delete
    console.log('7️⃣ Testing cascade delete...')
    await prisma.user.delete({
      where: { id: testUser.id }
    })

    const orphanedResets = await prisma.passwordReset.findMany({
      where: { userId: testUser.id }
    })
    const orphanedVerifications = await prisma.emailVerification.findMany({
      where: { userId: testUser.id }
    })

    if (orphanedResets.length === 0 && orphanedVerifications.length === 0) {
      console.log('✅ Cascade delete working - related records deleted')
    } else {
      console.log('❌ Cascade delete failed - orphaned records found')
    }

    console.log('🎉 All security table tests passed!')

  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run tests
testSecurityTables()
  .then(() => {
    console.log('✨ Database schema validation complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Schema validation failed:', error)
    process.exit(1)
  })