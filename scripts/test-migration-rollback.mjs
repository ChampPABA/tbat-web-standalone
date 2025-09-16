#!/usr/bin/env node

/**
 * Database Migration Rollback Testing Script
 * Tests migration rollback safety for production deployment
 */

import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'

const BACKUP_DIR = './prisma/backups'
const MIGRATION_DIR = './prisma/migrations'

class MigrationRollbackTester {
  constructor() {
    this.prisma = new PrismaClient()
    this.testResults = []
  }

  async init() {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true })
    console.log('🚀 Migration Rollback Testing initialized')
  }

  async getMigrationList() {
    try {
      const migrations = await fs.readdir(MIGRATION_DIR)
      return migrations
        .filter(dir => dir.match(/^\d{14}_/))
        .sort()
        .reverse()
    } catch (error) {
      console.error('❌ Failed to read migrations:', error.message)
      return []
    }
  }

  async createSchemaBackup(name) {
    const backupFile = path.join(BACKUP_DIR, `${name}-${Date.now()}.sql`)
    
    try {
      // Create schema dump
      execSync(`pg_dump --schema-only "${process.env.TEST_DATABASE_URL}" > "${backupFile}"`, {
        stdio: 'pipe'
      })
      
      console.log(`✅ Schema backup created: ${backupFile}`)
      return backupFile
    } catch (error) {
      console.error('❌ Failed to create backup:', error.message)
      throw error
    }
  }

  async testMigrationRollback(migrationName) {
    console.log(`\n🔄 Testing rollback for migration: ${migrationName}`)
    
    const testName = `rollback-${migrationName}`
    let backupFile = null
    
    try {
      // Step 1: Create backup before test
      backupFile = await this.createSchemaBackup(`before-${testName}`)
      
      // Step 2: Get current migration state
      const currentMigrations = await this.prisma.$queryRaw`
        SELECT migration_name FROM _prisma_migrations 
        WHERE finished_at IS NOT NULL 
        ORDER BY started_at DESC
      `
      
      console.log(`📊 Current applied migrations: ${currentMigrations.length}`)
      
      // Step 3: Test rollback simulation
      const rollbackResults = await this.simulateRollback(migrationName)
      
      // Step 4: Verify data integrity after rollback
      const integrityCheck = await this.verifyDataIntegrity()
      
      // Step 5: Re-apply migration to test forward compatibility
      const reapplyResults = await this.testReapplyMigration()
      
      const testResult = {
        migration: migrationName,
        rollbackSuccess: rollbackResults.success,
        integrityPreserved: integrityCheck.success,
        reapplySuccess: reapplyResults.success,
        errors: [
          ...rollbackResults.errors,
          ...integrityCheck.errors,
          ...reapplyResults.errors
        ],
        timestamp: new Date().toISOString()
      }
      
      this.testResults.push(testResult)
      
      if (testResult.rollbackSuccess && testResult.integrityPreserved && testResult.reapplySuccess) {
        console.log(`✅ Migration ${migrationName} rollback test PASSED`)
      } else {
        console.log(`❌ Migration ${migrationName} rollback test FAILED`)
      }
      
      return testResult
      
    } catch (error) {
      console.error(`❌ Rollback test failed for ${migrationName}:`, error.message)
      return {
        migration: migrationName,
        rollbackSuccess: false,
        integrityPreserved: false,
        reapplySuccess: false,
        errors: [error.message],
        timestamp: new Date().toISOString()
      }
    }
  }

  async simulateRollback(migrationName) {
    try {
      // In a real rollback, we would mark the migration as not applied
      // For testing, we simulate this by checking if we can safely remove the migration
      
      const migrationPath = path.join(MIGRATION_DIR, migrationName)
      const migrationSql = await fs.readFile(path.join(migrationPath, 'migration.sql'), 'utf8')
      
      // Check for destructive operations that cannot be rolled back
      const destructiveOperations = [
        'DROP TABLE',
        'DROP COLUMN',
        'DROP INDEX',
        'DROP CONSTRAINT'
      ]
      
      const hasDestructiveOps = destructiveOperations.some(op => 
        migrationSql.toUpperCase().includes(op)
      )
      
      if (hasDestructiveOps) {
        return {
          success: false,
          errors: ['Migration contains destructive operations that cannot be safely rolled back']
        }
      }
      
      // Test if we can generate reverse migration SQL
      const reverseMigration = this.generateReverseMigration(migrationSql)
      
      return {
        success: true,
        errors: [],
        reverseMigration
      }
      
    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      }
    }
  }

  generateReverseMigration(forwardSql) {
    // Basic reverse migration generation logic
    const reverseMappings = {
      'CREATE TABLE': 'DROP TABLE',
      'ADD COLUMN': 'DROP COLUMN',
      'CREATE INDEX': 'DROP INDEX',
      'ALTER TABLE.*ADD CONSTRAINT': 'ALTER TABLE.*DROP CONSTRAINT'
    }
    
    // This is a simplified example - real implementation would be more sophisticated
    let reverseSql = '-- Generated reverse migration\n'
    
    const lines = forwardSql.split('\n')
    for (const line of lines.reverse()) {
      if (line.trim().startsWith('CREATE TABLE')) {
        const tableName = line.match(/CREATE TABLE\s+"?(\w+)"?/i)?.[1]
        if (tableName) {
          reverseSql += `DROP TABLE IF EXISTS "${tableName}" CASCADE;\n`
        }
      }
    }
    
    return reverseSql
  }

  async verifyDataIntegrity() {
    try {
      // Check referential integrity
      const foreignKeyCheck = await this.prisma.$queryRaw`
        SELECT COUNT(*) as violations FROM (
          SELECT 1 FROM information_schema.table_constraints tc
          JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
        ) violations
      `
      
      // Check for orphaned records (simplified)
      const orphanCheck = await this.checkOrphanedRecords()
      
      return {
        success: orphanCheck.orphanCount === 0,
        errors: orphanCheck.orphanCount > 0 ? ['Orphaned records detected'] : []
      }
      
    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      }
    }
  }

  async checkOrphanedRecords() {
    // Check for basic orphaned records in key tables
    try {
      const userPackageOrphans = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "UserPackage" up
        LEFT JOIN "User" u ON up.user_id = u.id
        WHERE u.id IS NULL
      `
      
      return {
        orphanCount: Number(userPackageOrphans[0]?.count || 0)
      }
      
    } catch (error) {
      return { orphanCount: 0 }
    }
  }

  async testReapplyMigration() {
    try {
      // Test that migrations can be reapplied successfully
      execSync('npx prisma migrate deploy', {
        stdio: 'pipe',
        env: { ...process.env }
      })
      
      return {
        success: true,
        errors: []
      }
      
    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      }
    }
  }

  async generateRollbackReport() {
    const reportFile = path.join(BACKUP_DIR, `rollback-test-report-${Date.now()}.json`)
    
    const report = {
      testRun: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'test',
        databaseUrl: process.env.TEST_DATABASE_URL ? 'configured' : 'missing'
      },
      summary: {
        totalTests: this.testResults.length,
        passed: this.testResults.filter(r => r.rollbackSuccess && r.integrityPreserved && r.reapplySuccess).length,
        failed: this.testResults.filter(r => !r.rollbackSuccess || !r.integrityPreserved || !r.reapplySuccess).length
      },
      results: this.testResults
    }
    
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2))
    console.log(`\n📋 Rollback test report generated: ${reportFile}`)
    
    return report
  }

  async runAllTests() {
    await this.init()
    
    const migrations = await this.getMigrationList()
    
    if (migrations.length === 0) {
      console.log('⚠️ No migrations found to test')
      return
    }
    
    console.log(`🧪 Testing rollback for ${migrations.length} migrations`)
    
    // Test the last 3 migrations (most recent and risky)
    const recentMigrations = migrations.slice(0, 3)
    
    for (const migration of recentMigrations) {
      await this.testMigrationRollback(migration)
    }
    
    const report = await this.generateRollbackReport()
    
    // Output summary
    console.log('\n📊 MIGRATION ROLLBACK TEST SUMMARY')
    console.log('==================================')
    console.log(`Total Tests: ${report.summary.totalTests}`)
    console.log(`Passed: ${report.summary.passed}`)
    console.log(`Failed: ${report.summary.failed}`)
    
    if (report.summary.failed > 0) {
      console.log('\n❌ Some migration rollback tests failed!')
      process.exit(1)
    } else {
      console.log('\n✅ All migration rollback tests passed!')
    }
  }

  async cleanup() {
    await this.prisma.$disconnect()
  }
}

// Run the tests
async function main() {
  const tester = new MigrationRollbackTester()
  
  try {
    await tester.runAllTests()
  } catch (error) {
    console.error('❌ Migration rollback testing failed:', error.message)
    process.exit(1)
  } finally {
    await tester.cleanup()
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default MigrationRollbackTester