// Windows Service Wrapper for Face Analysis API
const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class FaceAnalysisService {
  constructor() {
    this.isRunning = false;
    this.pm2Process = null;
    this.healthCheckInterval = null;
    this.restartAttempts = 0;
    this.maxRestartAttempts = 5;
    
    // Ensure we're in the correct directory
    process.chdir(__dirname);
    
    console.log('🚀 Face Analysis API Service Wrapper Starting...');
    console.log(`📁 Working directory: ${process.cwd()}`);
    console.log(`🕐 Started at: ${new Date().toISOString()}`);
  }

  async start() {
    try {
      console.log('🔄 Starting Face Analysis API...');
      
      // Kill any existing PM2 processes first
      await this.killExistingProcesses();
      
      // Wait a moment
      await this.sleep(2000);
      
      // Start PM2 with ecosystem config
      await this.startPM2();
      
      // Start health monitoring
      this.startHealthMonitoring();
      
      this.isRunning = true;
      console.log('✅ Face Analysis API Service started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start Face Analysis API:', error.message);
      this.handleStartupError(error);
    }
  }

  async killExistingProcesses() {
    return new Promise((resolve) => {
      console.log('🛑 Stopping any existing PM2 processes...');
      exec('pm2 kill', (error, stdout, stderr) => {
        if (error) {
          console.log('⚠️  No existing PM2 processes to kill');
        } else {
          console.log('✅ Existing PM2 processes stopped');
        }
        resolve();
      });
    });
  }

  async startPM2() {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting PM2 with ecosystem configuration...');
      
      const ecosystemPath = path.join(__dirname, 'ecosystem.config.js');
      
      // Check if ecosystem config exists
      if (!fs.existsSync(ecosystemPath)) {
        console.error('❌ Ecosystem config not found:', ecosystemPath);
        return reject(new Error('Ecosystem config not found'));
      }
      
      const command = `pm2 start "${ecosystemPath}" --env production`;
      console.log(`📝 Executing: ${command}`);
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ PM2 start failed:', error.message);
          console.error('📝 stderr:', stderr);
          
          // Try alternative start method
          console.log('🔄 Trying alternative start method...');
          this.startPM2Alternative()
            .then(resolve)
            .catch(reject);
        } else {
          console.log('✅ PM2 started successfully');
          console.log('📝 stdout:', stdout);
          
          // Save PM2 configuration
          exec('pm2 save', (saveError) => {
            if (saveError) {
              console.warn('⚠️  Failed to save PM2 config:', saveError.message);
            } else {
              console.log('✅ PM2 configuration saved');
            }
            resolve();
          });
        }
      });
    });
  }

  async startPM2Alternative() {
    return new Promise((resolve, reject) => {
      console.log('🔄 Starting PM2 with alternative method...');
      
      const serverPath = path.join(__dirname, 'server.js');
      const command = `pm2 start "${serverPath}" --name "faceapp-backend" -i max --env production`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Alternative PM2 start failed:', error.message);
          reject(error);
        } else {
          console.log('✅ PM2 started with alternative method');
          console.log('📝 stdout:', stdout);
          
          exec('pm2 save', () => {
            resolve();
          });
        }
      });
    });
  }

  startHealthMonitoring() {
    console.log('🏥 Starting health monitoring...');
    
    // Health check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000);
    
    // Initial health check after 10 seconds
    setTimeout(() => {
      this.performHealthCheck();
    }, 10000);
  }

  async performHealthCheck() {
    try {
      // Check PM2 processes
      exec('pm2 jlist', (error, stdout) => {
        if (error) {
          console.log('⚠️  PM2 health check failed, attempting restart...');
          this.restartPM2();
          return;
        }

        try {
          const processes = JSON.parse(stdout);
          const faceappProcesses = processes.filter(p => 
            p.name === 'faceapp-backend' && p.pm2_env.status === 'online'
          );
          
          if (faceappProcesses.length === 0) {
            console.log('⚠️  No Face Analysis processes running, restarting...');
            this.restartPM2();
          } else {
            console.log(`✅ Health check: ${faceappProcesses.length} instances running`);
            this.restartAttempts = 0; // Reset restart attempts on success
          }
        } catch (parseError) {
          console.log('⚠️  Failed to parse PM2 output, restarting...');
          this.restartPM2();
        }
      });

      // Check API health
      this.checkAPIHealth();
      
    } catch (error) {
      console.error('❌ Health check error:', error.message);
    }
  }

  async checkAPIHealth() {
    try {
      const axios = require('axios');
      const response = await axios.get('http://localhost:3001/api/health', { 
        timeout: 5000 
      });
      
      if (response.data.success) {
        console.log('✅ API health check passed');
      } else {
        console.log('⚠️  API health check failed - invalid response');
      }
    } catch (error) {
      console.log('⚠️  API health check failed - not responding');
    }
  }

  async restartPM2() {
    if (this.restartAttempts >= this.maxRestartAttempts) {
      console.error('❌ Maximum restart attempts reached. Service may need manual intervention.');
      return;
    }

    this.restartAttempts++;
    console.log(`🔄 Restarting PM2 (attempt ${this.restartAttempts}/${this.maxRestartAttempts})...`);

    try {
      await this.killExistingProcesses();
      await this.sleep(3000);
      await this.startPM2();
      console.log('✅ PM2 restarted successfully');
    } catch (error) {
      console.error('❌ PM2 restart failed:', error.message);
    }
  }

  handleStartupError(error) {
    console.error('💥 Service startup failed:', error.message);
    
    // Try to start with basic Node.js server as fallback
    console.log('🔄 Attempting fallback startup...');
    
    const serverPath = path.join(__dirname, 'server.js');
    if (fs.existsSync(serverPath)) {
      console.log('🚀 Starting basic Node.js server...');
      
      const nodeProcess = spawn('node', [serverPath], {
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      nodeProcess.on('error', (err) => {
        console.error('❌ Fallback server failed:', err.message);
      });
      
      nodeProcess.on('exit', (code) => {
        console.log(`⚠️  Fallback server exited with code ${code}`);
      });
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('🛑 Stopping Face Analysis API Service...');
    
    this.isRunning = false;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Stop PM2 processes
    exec('pm2 kill', (error) => {
      if (error) {
        console.log('⚠️  Error stopping PM2:', error.message);
      } else {
        console.log('✅ PM2 processes stopped');
      }
    });
    
    console.log('✅ Face Analysis API Service stopped');
  }
}

// Create and start the service
const service = new FaceAnalysisService();

// Start the service
service.start();

// Handle process termination
process.on('SIGINT', () => {
  console.log('📨 Received SIGINT, stopping service...');
  service.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('📨 Received SIGTERM, stopping service...');
  service.stop();
  process.exit(0);
});

process.on('exit', () => {
  console.log('👋 Face Analysis API Service exiting...');
});

// Keep the process running
setInterval(() => {
  // Keep alive
}, 60000);

console.log('🎯 Face Analysis API Service Wrapper is running...');
