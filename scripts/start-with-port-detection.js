#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import net from 'net';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.listen(port, () => {
      server.once('close', () => {
        resolve(true);
      });
      server.close();
    });

    server.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Find the next available port starting from a given port
 */
async function findAvailablePort(startPort = 3000) {
  let port = startPort;

  while (port < startPort + 100) {
    if (await isPortAvailable(port)) {
      return port;
    }
    port++;
  }

  throw new Error('No available ports found');
}

/**
 * Update .env.local with the detected port
 */
function updateEnvFile(port) {
  const envPath = path.join(__dirname, '..', '.env.local');

  try {
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Remove existing NEXTAUTH_URL if present
    envContent = envContent.replace(/^NEXTAUTH_URL=.*$/m, '');

    // Add or update NEXTAUTH_URL with detected port
    const nextAuthUrl = `NEXTAUTH_URL="http://localhost:${port}"`;

    if (envContent.includes('# NextAuth Configuration')) {
      envContent = envContent.replace(
        '# NextAuth Configuration\n# NEXTAUTH_URL - Auto-detected from request headers when not set (for dynamic ports)',
        `# NextAuth Configuration\n${nextAuthUrl}`
      );
    } else {
      envContent += `\n# Auto-detected NextAuth URL\n${nextAuthUrl}\n`;
    }

    // Clean up extra newlines
    envContent = envContent.replace(/\n\n\n+/g, '\n\n');

    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Updated NEXTAUTH_URL to http://localhost:${port}`);
  } catch (error) {
    console.warn('⚠️  Could not update .env.local file:', error.message);
  }
}

/**
 * Start the Next.js development server
 */
async function startDevServer() {
  try {
    console.log('🔍 Detecting available port...');

    // Try common development ports first
    const preferredPorts = [3000, 3001, 3002, 3003];
    let selectedPort = null;

    for (const port of preferredPorts) {
      if (await isPortAvailable(port)) {
        selectedPort = port;
        break;
      }
    }

    // If no preferred port is available, find any available port
    if (!selectedPort) {
      selectedPort = await findAvailablePort(3000);
    }

    console.log(`🚀 Starting server on port ${selectedPort}`);

    // Update environment file
    updateEnvFile(selectedPort);

    // Start Next.js development server
    const nextProcess = spawn('npm', ['run', 'dev', '--', '--port', selectedPort.toString()], {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..'),
      env: {
        ...process.env,
        NEXTAUTH_URL: `http://localhost:${selectedPort}`
      },
      shell: true
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      nextProcess.kill('SIGINT');
      process.exit(0);
    });

    nextProcess.on('exit', (code) => {
      process.exit(code);
    });

  } catch (error) {
    console.error('❌ Error starting development server:', error.message);
    process.exit(1);
  }
}

// Run the port detection and server startup
startDevServer();