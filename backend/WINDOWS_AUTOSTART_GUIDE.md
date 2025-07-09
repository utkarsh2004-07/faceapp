# Windows Auto-Start Guide for PM2

## 🪟 **Windows Server Auto-Start Solutions**

Since you're on Windows, the standard PM2 startup doesn't work. Here are **3 proven methods** to auto-start your Face Analysis API on Windows server boot.

## 🎯 **Current Status**

✅ **PM2 is working perfectly** - 8 instances running in cluster mode  
✅ **PM2 configuration saved** - Your processes are saved  
⚠️ **Auto-start needs Windows-specific setup**

## 🚀 **Method 1: PM2 Windows Service (Recommended)**

### **Step 1: Install PM2 Windows Service**
```bash
# Install the Windows service package
npm install -g pm2-windows-service

# Install the service
pm2-service-install -n "FaceAnalysisAPI"
```

### **Step 2: Configure the Service**
```bash
# Set the service to start your PM2 processes
pm2-service-install -n "FaceAnalysisAPI" --script "C:\path\to\your\backend\ecosystem.config.js"
```

### **Step 3: Start the Service**
```bash
# Start the Windows service
net start "FaceAnalysisAPI"

# Or use Services.msc GUI
# 1. Press Win + R, type "services.msc"
# 2. Find "FaceAnalysisAPI"
# 3. Right-click → Properties
# 4. Set Startup type to "Automatic"
# 5. Click Start
```

## 🔧 **Method 2: Windows Task Scheduler (Alternative)**

### **Step 1: Create Startup Script**
Create `start-faceapp.bat` in your backend folder:

```batch
@echo off
cd /d "D:\myidea\faceapp\backend"
call npm run pm2:start:prod
echo Face Analysis API started successfully
pause
```

### **Step 2: Create Task Scheduler Entry**
1. **Open Task Scheduler** (Win + R → `taskschd.msc`)
2. **Create Basic Task**
   - Name: `Face Analysis API Auto-Start`
   - Description: `Auto-start Face Analysis API with PM2`
3. **Trigger**: `When the computer starts`
4. **Action**: `Start a program`
   - Program: `D:\myidea\faceapp\backend\start-faceapp.bat`
   - Start in: `D:\myidea\faceapp\backend`
5. **Settings**:
   - ✅ Run whether user is logged on or not
   - ✅ Run with highest privileges
   - ✅ Configure for Windows 10/11

## ⚡ **Method 3: Node.js Windows Service (Advanced)**

### **Step 1: Install node-windows**
```bash
npm install -g node-windows
```

### **Step 2: Create Service Script**
Create `install-service.js`:

```javascript
const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Face Analysis API',
  description: 'Face Analysis API with PM2 Clustering',
  script: path.join(__dirname, 'service-wrapper.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=2048'
  ]
});

// Listen for the "install" event
svc.on('install', function(){
  console.log('✅ Face Analysis API service installed successfully');
  svc.start();
});

// Install the service
svc.install();
```

### **Step 3: Create Service Wrapper**
Create `service-wrapper.js`:

```javascript
const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting Face Analysis API Service...');

// Change to backend directory
process.chdir(__dirname);

// Start PM2 with ecosystem config
exec('pm2 start ecosystem.config.js --env production', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error starting PM2:', error);
    return;
  }
  console.log('✅ PM2 started successfully');
  console.log(stdout);
});

// Keep the service running
setInterval(() => {
  // Health check every 30 seconds
  exec('pm2 jlist', (error, stdout) => {
    if (error) {
      console.log('⚠️ PM2 health check failed, restarting...');
      exec('pm2 start ecosystem.config.js --env production');
    } else {
      const processes = JSON.parse(stdout);
      const running = processes.filter(p => p.name === 'faceapp-backend' && p.pm2_env.status === 'online');
      console.log(`✅ Health check: ${running.length}/8 instances running`);
    }
  });
}, 30000);
```

## 📋 **Quick Setup Commands**

I've created easy commands for you:

```bash
# Method 1: PM2 Windows Service (Recommended)
npm install -g pm2-windows-service
pm2-service-install -n "FaceAnalysisAPI"

# Method 2: Create startup script
# (Manual setup via Task Scheduler)

# Method 3: Node.js Windows Service
npm install -g node-windows
node install-service.js
```

## 🧪 **Testing Auto-Start**

### **Test Method 1 (PM2 Service)**
```bash
# Check if service is installed
sc query "FaceAnalysisAPI"

# Start the service
net start "FaceAnalysisAPI"

# Check PM2 status
pm2 status

# Test API
curl http://localhost:3001/api/health
```

### **Test Method 2 (Task Scheduler)**
1. **Restart your computer**
2. **Wait 2 minutes**
3. **Check PM2**: `pm2 status`
4. **Test API**: `curl http://localhost:3001/api/health`

### **Test Method 3 (Node Service)**
```bash
# Check service status
sc query "Face Analysis API"

# Test API
curl http://localhost:3001/api/health
```

## 🔍 **How to Verify Auto-Start is Working**

### **1. Check Windows Services**
```bash
# List all services containing "face" or "pm2"
sc query | findstr -i "face\|pm2"

# Check specific service
sc query "FaceAnalysisAPI"
```

### **2. Check PM2 Status**
```bash
pm2 status
```
**Should show:** 8 instances of `faceapp-backend` running

### **3. Check API Health**
```bash
curl http://localhost:3001/api/health
```
**Should return:** Success response with performance metrics

### **4. Check Event Logs**
1. **Open Event Viewer** (Win + R → `eventvwr.msc`)
2. **Navigate to**: Windows Logs → System
3. **Look for**: Service start events

## 🚨 **Troubleshooting**

### **Service Won't Start**
```bash
# Check service status
sc query "FaceAnalysisAPI"

# Check service configuration
sc qc "FaceAnalysisAPI"

# Start manually
net start "FaceAnalysisAPI"

# Check logs
pm2 logs
```

### **PM2 Not Starting**
```bash
# Kill all PM2 processes
pm2 kill

# Start fresh
pm2 start ecosystem.config.js --env production

# Save configuration
pm2 save
```

### **API Not Responding**
```bash
# Check if port is in use
netstat -an | findstr :3001

# Check PM2 logs
pm2 logs faceapp-backend

# Restart PM2
pm2 restart faceapp-backend
```

## 📊 **Recommended Setup for Production**

### **For Windows Server (Production)**
```bash
# 1. Install PM2 Windows Service
npm install -g pm2-windows-service

# 2. Install the service
pm2-service-install -n "FaceAnalysisAPI"

# 3. Configure auto-start
sc config "FaceAnalysisAPI" start= auto

# 4. Start the service
net start "FaceAnalysisAPI"

# 5. Verify
pm2 status
curl http://localhost:3001/api/health
```

### **For Development (Local)**
```bash
# Use Task Scheduler method
# Create start-faceapp.bat and set up task
```

## 🎉 **Summary**

### **Current Status:**
- ✅ PM2 clustering working (8 instances)
- ✅ Performance optimized
- ✅ MongoDB indexed
- ⚠️ Auto-start needs Windows setup

### **Choose Your Method:**
1. **PM2 Windows Service** (Recommended for servers)
2. **Task Scheduler** (Simple, good for development)
3. **Node.js Windows Service** (Advanced, most reliable)

### **After Setup:**
- ✅ Your API will start automatically on server boot
- ✅ 8 PM2 instances will start in cluster mode
- ✅ MongoDB indexes will be available
- ✅ Performance monitoring will be active
- ✅ Auto-restart on crashes

**Your Face Analysis API will be fully automated and production-ready!** 🚀

## 🔧 **Quick Commands Reference**

```bash
# Check if auto-start is working
npm run autostart:check

# Disable auto-start (if needed)
npm run autostart:disable

# Manual start (if auto-start fails)
npm run pm2:start:prod

# Check status
pm2 status

# Monitor performance
npm run monitor
```
