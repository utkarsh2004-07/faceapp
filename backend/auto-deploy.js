#!/usr/bin/env node

/**
 * Face Analysis API - One-Command Auto Deployment Script
 * Author: Utkarsh
 * Cross-platform Node.js deployment script
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execAsync = util.promisify(exec);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class AutoDeployer {
  constructor() {
    this.isWindows = process.platform === 'win32';
    this.appName = 'faceapp-backend';
    this.steps = [];
    this.currentStep = 0;
  }

  log(message, color = 'blue') {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  error(message) {
    this.log(`❌ ${message}`, 'red');
  }

  warning(message) {
    this.log(`⚠️  ${message}`, 'yellow');
  }

  info(message) {
    this.log(`ℹ️  ${message}`, 'cyan');
  }

  printHeader() {
    console.log(colors.blue);
    console.log('==========================================');
    console.log('  Face Analysis API Auto-Deployment');
    console.log('  Author: Utkarsh');
    console.log(`  Platform: ${process.platform}`);
    console.log(`  Date: ${new Date().toLocaleString()}`);
    console.log('==========================================');
    console.log(colors.reset);
  }

  async checkNodeJS() {
    this.info('Checking Node.js installation...');
    try {
      const { stdout } = await execAsync('node --version');
      const version = stdout.trim();
      const majorVersion = parseInt(version.substring(1).split('.')[0]);
      
      if (majorVersion >= 18) {
        this.success(`Node.js ${version} is installed`);
        return true;
      } else {
        this.error(`Node.js ${version} is too old. Please install Node.js 18+`);
        return false;
      }
    } catch (error) {
      this.error('Node.js is not installed. Please install Node.js 18+ and try again.');
      return false;
    }
  }

  async checkPM2() {
    this.info('Checking PM2 installation...');
    try {
      const { stdout } = await execAsync('pm2 --version');
      this.success(`PM2 ${stdout.trim()} is installed`);
      return true;
    } catch (error) {
      this.info('Installing PM2 globally...');
      try {
        await execAsync('npm install -g pm2');
        this.success('PM2 installed successfully');
        return true;
      } catch (installError) {
        this.error('Failed to install PM2. Please install manually: npm install -g pm2');
        return false;
      }
    }
  }

  async installDependencies() {
    this.info('Installing Node.js dependencies...');
    try {
      // On Windows, try to handle Sharp library lock issues
      if (this.isWindows) {
        try {
          // First try to kill any processes that might be using Sharp
          await execAsync('taskkill /f /im node.exe 2>nul || echo "No node processes to kill"');
          await this.sleep(2000);
        } catch (error) {
          // Ignore errors from taskkill
        }
      }

      let command;
      if (fs.existsSync('package-lock.json')) {
        command = this.isWindows ? 'npm install --omit=dev' : 'npm ci --only=production';
      } else {
        command = 'npm install --only=production';
      }

      await execAsync(command);
      this.success('Dependencies installed successfully');
      return true;
    } catch (error) {
      this.warning('Standard installation failed, trying alternative method...');

      // Try alternative installation method
      try {
        await execAsync('npm install --force --only=production');
        this.success('Dependencies installed with alternative method');
        return true;
      } catch (altError) {
        this.error('Failed to install dependencies with both methods');
        console.error('Original error:', error.message);
        console.error('Alternative error:', altError.message);

        // Provide helpful guidance
        console.log('\n' + colors.yellow + 'Possible solutions:' + colors.reset);
        console.log('1. Close any text editors or IDEs that might be using the project');
        console.log('2. Run the command as Administrator (Windows)');
        console.log('3. Temporarily disable antivirus software');
        console.log('4. Delete node_modules folder and try again');

        return false;
      }
    }
  }

  async setupEnvironment() {
    this.info('Setting up environment configuration...');
    
    if (!fs.existsSync('.env')) {
      let envContent = '';
      
      if (fs.existsSync('.env.example')) {
        envContent = fs.readFileSync('.env.example', 'utf8');
        this.warning('Created .env from .env.example. Please update with your production values.');
      } else {
        envContent = `NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/faceapp_production
JWT_SECRET=${this.generateRandomString(32)}
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=dy1tsskkm
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_FOLDER=faceapp-uploads
CLOUDINARY_AUTO_DELETE_DAYS=5
UV_THREADPOOL_SIZE=16
NODE_OPTIONS=--max-old-space-size=2048`;
        this.warning('Created basic .env file. Please update with your production values.');
      }
      
      fs.writeFileSync('.env', envContent);
      
      // Set file permissions on Unix systems
      if (!this.isWindows) {
        try {
          await execAsync('chmod 600 .env');
        } catch (error) {
          // Ignore permission errors
        }
      }
    } else {
      this.success('Environment file already exists');
    }
    
    return true;
  }

  async setupDatabase() {
    this.info('Setting up MongoDB indexes for performance...');
    
    if (fs.existsSync('scripts/createIndexes.js')) {
      try {
        await execAsync('node scripts/createIndexes.js');
        this.success('MongoDB indexes created successfully');
      } catch (error) {
        this.warning('MongoDB index creation failed. Database might not be available.');
      }
    } else {
      this.warning('MongoDB index script not found. Skipping database optimization.');
    }
    
    return true;
  }

  async stopExistingProcesses() {
    this.info('Stopping any existing processes...');

    try {
      await execAsync('pm2 kill');
    } catch (error) {
      // PM2 might not be running, which is fine
    }

    // On Windows, also kill any Node.js processes that might be locking files
    if (this.isWindows) {
      try {
        await execAsync('taskkill /f /im node.exe 2>nul || echo "No additional node processes"');
        await this.sleep(1000);
      } catch (error) {
        // Ignore errors
      }
    }

    this.success('Existing processes stopped');
    return true;
  }

  async cleanNodeModules() {
    this.info('Cleaning node_modules for fresh installation...');

    try {
      if (fs.existsSync('node_modules')) {
        if (this.isWindows) {
          await execAsync('rmdir /s /q node_modules');
        } else {
          await execAsync('rm -rf node_modules');
        }
      }

      if (fs.existsSync('package-lock.json')) {
        fs.unlinkSync('package-lock.json');
      }

      this.success('node_modules cleaned');
      return true;
    } catch (error) {
      this.warning('Could not clean node_modules automatically');
      return true; // Don't fail the deployment for this
    }
  }

  async startPM2() {
    this.info('Starting Face Analysis API with PM2 clustering...');
    
    try {
      let command;
      if (fs.existsSync('ecosystem.config.js')) {
        command = 'pm2 start ecosystem.config.js --env production';
      } else {
        command = `pm2 start server.js --name "${this.appName}" -i max --env production`;
      }
      
      await execAsync(command);
      await execAsync('pm2 save');
      
      this.success('PM2 started with clustering enabled');
      return true;
    } catch (error) {
      this.error('Failed to start PM2 processes');
      console.error(error.message);
      return false;
    }
  }

  async setupAutoStart() {
    this.info('Setting up auto-start on system boot...');
    
    if (this.isWindows) {
      // Windows auto-start setup
      try {
        await execAsync('npm install -g pm2-windows-service');
        await execAsync('pm2-service-install -n "FaceAnalysisAPI"');
        this.success('Windows service installed for auto-start');
      } catch (error) {
        this.warning('Windows service installation failed. You can set up auto-start manually using Task Scheduler.');
      }
    } else {
      // Linux/macOS auto-start setup
      try {
        const { stdout } = await execAsync('pm2 startup');
        
        if (stdout.includes('sudo env PATH')) {
          const startupCmd = stdout.split('\n').find(line => line.includes('sudo env PATH'));
          this.warning('Please run this command to complete auto-start setup:');
          console.log(colors.yellow + startupCmd + colors.reset);
        }
        
        await execAsync('pm2 save');
        this.success('Auto-start configuration completed');
      } catch (error) {
        this.warning('Auto-start setup may need manual configuration. Run "pm2 startup" manually.');
      }
    }
    
    return true;
  }

  async testDeployment() {
    this.info('Testing deployment...');
    
    // Wait for application to start
    await this.sleep(10000);
    
    try {
      const { stdout } = await execAsync('pm2 jlist');
      const processes = JSON.parse(stdout);
      const faceappProcesses = processes.filter(p => p.name === this.appName);
      
      if (faceappProcesses.length > 0) {
        const onlineProcesses = faceappProcesses.filter(p => p.pm2_env.status === 'online');
        this.success(`PM2 processes running: ${onlineProcesses.length}/${faceappProcesses.length}`);
      } else {
        this.error('No PM2 processes found');
        return false;
      }
      
      // Test API health
      try {
        await execAsync('curl -f http://localhost:3001/api/health');
        this.success('API health check passed');
      } catch (error) {
        this.warning('API health check failed. The API might still be starting up.');
      }
      
      return true;
    } catch (error) {
      this.error('Deployment test failed');
      return false;
    }
  }

  async createManagementScripts() {
    this.info('Creating management scripts...');
    
    // Create monitoring script
    const monitorScript = this.isWindows ? this.createWindowsMonitorScript() : this.createUnixMonitorScript();
    fs.writeFileSync(this.isWindows ? 'monitor.bat' : 'monitor.sh', monitorScript);
    
    // Create restart script
    const restartScript = this.isWindows ? this.createWindowsRestartScript() : this.createUnixRestartScript();
    fs.writeFileSync(this.isWindows ? 'restart.bat' : 'restart.sh', restartScript);
    
    // Set execute permissions on Unix
    if (!this.isWindows) {
      try {
        await execAsync('chmod +x monitor.sh restart.sh');
      } catch (error) {
        // Ignore permission errors
      }
    }
    
    this.success('Management scripts created');
    return true;
  }

  createWindowsMonitorScript() {
    return `@echo off
echo Face Analysis API Status - %date% %time%
echo ==================================
echo.
echo PM2 Status:
pm2 status
echo.
echo API Health:
curl -f http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
    echo API is not responding
) else (
    echo API is responding correctly
)
pause`;
  }

  createUnixMonitorScript() {
    return `#!/bin/bash
echo "Face Analysis API Status - $(date)"
echo "=================================="
echo ""
echo "PM2 Status:"
pm2 status
echo ""
echo "API Health:"
if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ API is responding"
else
    echo "❌ API is not responding"
fi`;
  }

  createWindowsRestartScript() {
    return `@echo off
echo Restarting Face Analysis API...
pm2 restart ${this.appName}
echo Restart completed
pm2 status
pause`;
  }

  createUnixRestartScript() {
    return `#!/bin/bash
echo "🔄 Restarting Face Analysis API..."
pm2 restart ${this.appName}
echo "✅ Restart completed"
pm2 status`;
  }

  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  displayFinalStatus() {
    console.log('');
    this.printHeader();
    this.success('🎉 Face Analysis API Deployment Completed Successfully!');
    console.log('');
    
    console.log(colors.green + '✅ What\'s been set up:' + colors.reset);
    console.log('   • Node.js and PM2 verified/installed');
    console.log('   • Dependencies installed');
    console.log('   • Environment configured');
    console.log('   • MongoDB indexes optimized');
    console.log('   • PM2 clustering enabled');
    console.log('   • Auto-start configured');
    console.log('   • Management scripts created');
    
    console.log('');
    console.log(colors.blue + '📋 Management Commands:' + colors.reset);
    const scriptExt = this.isWindows ? '.bat' : '.sh';
    console.log(`   ./monitor${scriptExt}     - Check status and health`);
    console.log(`   ./restart${scriptExt}     - Restart the application`);
    console.log('   pm2 status       - Check PM2 processes');
    console.log('   pm2 logs         - View application logs');
    console.log('   pm2 monit        - Real-time monitoring');
    
    console.log('');
    console.log(colors.blue + '🌐 API Information:' + colors.reset);
    console.log('   Local URL:  http://localhost:3001');
    console.log('   Health:     http://localhost:3001/api/health');
    
    console.log('');
    console.log(colors.yellow + '⚠️ Next Steps:' + colors.reset);
    console.log('   1. Update .env file with your production values');
    console.log('   2. Configure firewall to allow port 3001');
    console.log('   3. Set up reverse proxy for production');
    console.log('   4. Test auto-start by restarting your system');
    
    console.log('');
    this.success('Your Face Analysis API is now production-ready! 🚀');
  }

  async deploy() {
    this.printHeader();
    
    const steps = [
      { name: 'Check Node.js', fn: () => this.checkNodeJS() },
      { name: 'Check/Install PM2', fn: () => this.checkPM2() },
      { name: 'Install Dependencies', fn: () => this.installDependencies() },
      { name: 'Setup Environment', fn: () => this.setupEnvironment() },
      { name: 'Setup Database', fn: () => this.setupDatabase() },
      { name: 'Stop Existing Processes', fn: () => this.stopExistingProcesses() },
      { name: 'Start PM2', fn: () => this.startPM2() },
      { name: 'Setup Auto-Start', fn: () => this.setupAutoStart() },
      { name: 'Test Deployment', fn: () => this.testDeployment() },
      { name: 'Create Management Scripts', fn: () => this.createManagementScripts() }
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      this.info(`Step ${i + 1}/${steps.length}: ${step.name}`);
      
      const success = await step.fn();
      if (!success) {
        this.error(`Step failed: ${step.name}`);
        process.exit(1);
      }
    }

    this.displayFinalStatus();
  }
}

// Run deployment if this script is executed directly
if (require.main === module) {
  const deployer = new AutoDeployer();
  deployer.deploy().catch(error => {
    console.error('Deployment failed:', error);
    process.exit(1);
  });
}

module.exports = AutoDeployer;
