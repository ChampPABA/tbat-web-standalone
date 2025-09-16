#!/usr/bin/env node

/**
 * TBAT Development Server Port Detection Script
 * Automatically detects available port for development server
 * and sets up environment for Playwright testing
 */

const net = require('net');
const fs = require('fs');
const path = require('path');

const COMMON_PORTS = [3000, 3001, 3002, 3003];

/**
 * Check if a port is available
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(false); // Port is busy
    });
  });
}

/**
 * Find the first available port from the common ports list
 */
async function findAvailablePort() {
  for (const port of COMMON_PORTS) {
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      return port;
    }
  }
  
  // If no common port is available, find any available port
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

/**
 * Update .env.local with the detected port
 */
function updateEnvFile(port) {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Remove existing DEV_SERVER_PORT line if it exists
  const lines = envContent.split('\n').filter(line => 
    !line.startsWith('DEV_SERVER_PORT=')
  );
  
  // Add new DEV_SERVER_PORT line
  lines.push(`DEV_SERVER_PORT=${port}`);
  
  // Write back to file
  fs.writeFileSync(envPath, lines.join('\n'));
  
  console.log(`✅ Updated .env.local with DEV_SERVER_PORT=${port}`);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🔍 Detecting available port for TBAT development server...');
    
    const port = await findAvailablePort();
    
    console.log(`✨ Found available port: ${port}`);
    
    // Update environment file
    updateEnvFile(port);
    
    // Set environment variable for current process
    process.env.DEV_SERVER_PORT = port.toString();
    
    console.log('🚀 Ready to start development server and Playwright tests');
    console.log(`   Server URL: http://localhost:${port}`);
    console.log(`   Use: DEV_SERVER_PORT=${port} npm run dev`);
    
  } catch (error) {
    console.error('❌ Error detecting port:', error.message);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = { findAvailablePort, updateEnvFile };