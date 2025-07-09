// Windows Service Installation Script for Face Analysis API
const path = require('path');

async function installWindowsService() {
  console.log('🪟 Installing Face Analysis API as Windows Service...\n');

  try {
    // Check if node-windows is available
    let Service;
    try {
      Service = require('node-windows').Service;
    } catch (error) {
      console.log('📦 Installing node-windows package...');
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      await execAsync('npm install -g node-windows');
      console.log('✅ node-windows installed successfully');
      
      Service = require('node-windows').Service;
    }

    // Create service configuration
    const svc = new Service({
      name: 'Face Analysis API',
      description: 'Face Analysis API with PM2 Clustering - Auto-start on Windows boot',
      script: path.join(__dirname, 'service-wrapper.js'),
      nodeOptions: [
        '--harmony',
        '--max_old_space_size=2048'
      ],
      env: {
        name: 'NODE_ENV',
        value: 'production'
      }
    });

    // Install event handlers
    svc.on('install', function() {
      console.log('✅ Face Analysis API service installed successfully!');
      console.log('🚀 Starting the service...');
      svc.start();
    });

    svc.on('start', function() {
      console.log('✅ Face Analysis API service started successfully!');
      console.log('\n🎉 Setup Complete!');
      console.log('='.repeat(50));
      console.log('✅ Service Name: Face Analysis API');
      console.log('✅ Auto-start: Enabled');
      console.log('✅ PM2 Clustering: 8 instances');
      console.log('✅ API URL: http://localhost:3001');
      console.log('\n📋 Service Management:');
      console.log('   Start:   net start "Face Analysis API"');
      console.log('   Stop:    net stop "Face Analysis API"');
      console.log('   Status:  sc query "Face Analysis API"');
      console.log('\n🔧 PM2 Commands:');
      console.log('   Status:  pm2 status');
      console.log('   Logs:    pm2 logs');
      console.log('   Monitor: pm2 monit');
      
      process.exit(0);
    });

    svc.on('error', function(error) {
      console.error('❌ Service error:', error);
      process.exit(1);
    });

    // Check if service already exists
    const { exec } = require('child_process');
    exec('sc query "Face Analysis API"', (error, stdout, stderr) => {
      if (!error && stdout.includes('SERVICE_NAME')) {
        console.log('⚠️  Service already exists. Uninstalling first...');
        svc.uninstall();
        setTimeout(() => {
          console.log('🔄 Reinstalling service...');
          svc.install();
        }, 3000);
      } else {
        console.log('📦 Installing new service...');
        svc.install();
      }
    });

  } catch (error) {
    console.error('❌ Installation failed:', error.message);
    console.log('\n🔧 Manual Installation Steps:');
    console.log('1. npm install -g node-windows');
    console.log('2. node install-windows-service.js');
    console.log('3. net start "Face Analysis API"');
    process.exit(1);
  }
}

async function uninstallWindowsService() {
  console.log('🗑️ Uninstalling Face Analysis API Windows Service...\n');

  try {
    const Service = require('node-windows').Service;
    
    const svc = new Service({
      name: 'Face Analysis API',
      script: path.join(__dirname, 'service-wrapper.js')
    });

    svc.on('uninstall', function() {
      console.log('✅ Face Analysis API service uninstalled successfully!');
      console.log('📋 The service will no longer start automatically on boot');
      console.log('🔧 To start manually: npm run pm2:start:prod');
      process.exit(0);
    });

    svc.uninstall();

  } catch (error) {
    console.error('❌ Uninstallation failed:', error.message);
    console.log('\n🔧 Manual Uninstallation:');
    console.log('1. net stop "Face Analysis API"');
    console.log('2. sc delete "Face Analysis API"');
    process.exit(1);
  }
}

async function checkServiceStatus() {
  console.log('🔍 Checking Face Analysis API Service Status...\n');

  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);

  try {
    // Check if service exists
    const { stdout } = await execAsync('sc query "Face Analysis API"');
    
    if (stdout.includes('SERVICE_NAME')) {
      console.log('✅ Service is installed');
      
      if (stdout.includes('RUNNING')) {
        console.log('✅ Service is running');
      } else if (stdout.includes('STOPPED')) {
        console.log('⚠️  Service is stopped');
        console.log('🔧 To start: net start "Face Analysis API"');
      } else {
        console.log('⚠️  Service status unknown');
      }
      
      // Check PM2 status
      try {
        const { stdout: pm2Output } = await execAsync('pm2 jlist');
        const processes = JSON.parse(pm2Output);
        const faceappProcesses = processes.filter(p => p.name === 'faceapp-backend');
        
        if (faceappProcesses.length > 0) {
          console.log(`✅ PM2 is running with ${faceappProcesses.length} instances`);
        } else {
          console.log('⚠️  PM2 processes not found');
        }
      } catch (error) {
        console.log('⚠️  Could not check PM2 status');
      }
      
      // Test API
      try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:3001/api/health', { timeout: 5000 });
        if (response.data.success) {
          console.log('✅ API is responding correctly');
        }
      } catch (error) {
        console.log('⚠️  API is not responding');
      }
      
    } else {
      console.log('❌ Service is not installed');
      console.log('🔧 To install: node install-windows-service.js install');
    }

  } catch (error) {
    console.log('❌ Service is not installed or error occurred');
    console.log('🔧 To install: node install-windows-service.js install');
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'install':
      await installWindowsService();
      break;
    
    case 'uninstall':
      await uninstallWindowsService();
      break;
    
    case 'status':
      await checkServiceStatus();
      break;
    
    default:
      console.log('🪟 Face Analysis API Windows Service Manager');
      console.log('');
      console.log('Usage:');
      console.log('  node install-windows-service.js install    - Install Windows service');
      console.log('  node install-windows-service.js uninstall  - Uninstall Windows service');
      console.log('  node install-windows-service.js status     - Check service status');
      console.log('');
      console.log('Examples:');
      console.log('  node install-windows-service.js install');
      console.log('  node install-windows-service.js status');
      console.log('');
      console.log('After installation:');
      console.log('  net start "Face Analysis API"    - Start service');
      console.log('  net stop "Face Analysis API"     - Stop service');
      console.log('  sc query "Face Analysis API"     - Check status');
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { installWindowsService, uninstallWindowsService, checkServiceStatus };
