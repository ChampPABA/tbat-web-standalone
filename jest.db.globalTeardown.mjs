export default async function globalTeardown() {
  console.log('🧹 Cleaning up test database...')
  
  // Optional: Clean up test data or connections
  // For CI/CD, the test database container will be destroyed anyway
  
  console.log('✅ Test database cleanup complete')
}