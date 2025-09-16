#!/usr/bin/env node

/**
 * TBAT Playwright Helper Script
 * Manages development server and Playwright MCP integration
 */

import { spawn } from 'child_process';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if port is in use
 */
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, () => {
      server.once('close', () => {
        resolve(false); // Port is available
      });
      server.close();
    });
    
    server.on('error', () => {
      resolve(true); // Port is in use
    });
  });
}

/**
 * Find the currently running development server
 */
async function findRunningServer() {
  const commonPorts = [3000, 3001, 3002, 3003];
  
  for (const port of commonPorts) {
    const inUse = await checkPort(port);
    if (inUse) {
      // Try to make a request to verify it's our Next.js server
      try {
        const response = await fetch(`http://localhost:${port}`);
        if (response.ok || response.status === 404) {
          console.log(`✅ Found running development server at port ${port}`);
          return port;
        }
      } catch (e) {
        // Not our server, continue checking
      }
    }
  }
  
  return null;
}

/**
 * Update .env.local with the current server port
 */
function updateEnvWithPort(port) {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Remove existing DEV_SERVER_PORT line
  const lines = envContent.split('\n').filter(line => 
    !line.startsWith('DEV_SERVER_PORT=')
  );
  
  // Add new port
  lines.push(`DEV_SERVER_PORT=${port}`);
  
  fs.writeFileSync(envPath, lines.join('\n'));
  console.log(`📝 Updated .env.local with DEV_SERVER_PORT=${port}`);
}

/**
 * Show usage instructions
 */
function showUsage() {
  console.log(`
🎭 TBAT Playwright Helper

Usage:
  node scripts/playwright-helper.js detect    - Detect running server and update config
  node scripts/playwright-helper.js test      - Run Playwright tests with current config
  node scripts/playwright-helper.js setup     - Setup environment for testing

Examples:
  npm run playwright:setup                    - Quick setup
  DEV_SERVER_PORT=3002 npm run test:e2e      - Run tests with specific port
  `);
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'detect':
      console.log('🔍 Detecting running development server...');
      const port = await findRunningServer();
      
      if (port) {
        updateEnvWithPort(port);
        process.env.DEV_SERVER_PORT = port.toString();
        console.log(`🚀 Ready for Playwright tests at http://localhost:${port}`);
      } else {
        console.log('⚠️  No running development server found.');
        console.log('💡 Start your development server first:');
        console.log('   npm run dev:3002');
        console.log('   npm run dev:3001');
        console.log('   npm run dev');
      }
      break;
      
    case 'test':
      // First detect, then run tests
      const detectedPort = await findRunningServer();
      if (detectedPort) {
        updateEnvWithPort(detectedPort);
        console.log('🎭 Running Playwright tests...');
        
        const testProcess = spawn('npx', ['playwright', 'test'], {
          stdio: 'inherit',
          shell: true,
          env: { 
            ...process.env, 
            DEV_SERVER_PORT: detectedPort.toString() 
          }
        });
        
        testProcess.on('close', (code) => {
          process.exit(code);
        });
      } else {
        console.log('❌ No development server running. Start server first.');
        process.exit(1);
      }
      break;
      
    case 'setup':
      await main.detect();
      console.log('✨ Environment setup complete for TBAT Playwright testing');
      break;
      
    default:
      showUsage();
      break;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { findRunningServer, updateEnvWithPort };