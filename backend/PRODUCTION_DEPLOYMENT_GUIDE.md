# Face Analysis API - Production Deployment Guide

## 🚀 **Complete Guide to Host Your Backend with PM2**

This guide covers everything you need to deploy your Face Analysis API to a production server with PM2 clustering and auto-start capabilities.

---

## 📋 **Table of Contents**

1. [Server Requirements](#server-requirements)
2. [Pre-Deployment Setup](#pre-deployment-setup)
3. [Code Deployment](#code-deployment)
4. [Environment Configuration](#environment-configuration)
5. [Dependencies Installation](#dependencies-installation)
6. [Database Setup](#database-setup)
7. [PM2 Setup and Configuration](#pm2-setup-and-configuration)
8. [Auto-Start Configuration](#auto-start-configuration)
9. [Testing and Verification](#testing-and-verification)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)
11. [Troubleshooting](#troubleshooting)
12. [Security Considerations](#security-considerations)

---

## 🖥️ **Server Requirements**

### **Minimum Requirements**
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **CPU**: 2 cores (4+ cores recommended for PM2 clustering)
- **RAM**: 4GB (8GB+ recommended)
- **Storage**: 20GB SSD
- **Network**: Stable internet connection

### **Recommended Requirements**
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 4-8 cores (for optimal PM2 clustering)
- **RAM**: 8-16GB
- **Storage**: 50GB+ SSD
- **Network**: High-speed internet with static IP

### **Software Requirements**
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **MongoDB**: v5.0+ (local or cloud)
- **PM2**: Latest version
- **Git**: For code deployment

---

## 🔧 **Pre-Deployment Setup**

### **1. Update Your Server**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/RHEL
sudo yum update -y
# or for newer versions
sudo dnf update -y
```

### **2. Install Node.js**
```bash
# Method 1: Using NodeSource repository (Recommended)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Method 2: Using NVM (Alternative)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20
nvm alias default 20
```

### **3. Verify Installation**
```bash
node --version    # Should show v20.x.x or higher
npm --version     # Should show v9.x.x or higher
```

### **4. Install PM2 Globally**
```bash
npm install -g pm2

# Verify PM2 installation
pm2 --version
```

### **5. Install Git (if not installed)**
```bash
# Ubuntu/Debian
sudo apt install git -y

# CentOS/RHEL
sudo yum install git -y
```

---

## 📦 **Code Deployment**

### **Method 1: Git Clone (Recommended)**
```bash
# Navigate to your desired directory
cd /opt  # or /var/www or /home/yourusername

# Clone your repository
git clone https://github.com/yourusername/faceapp-backend.git
# or if using private repo with SSH
git clone git@github.com:yourusername/faceapp-backend.git

# Navigate to backend directory
cd faceapp-backend/backend
```

### **Method 2: File Upload**
```bash
# If uploading files manually via SCP/SFTP
# Create directory
sudo mkdir -p /opt/faceapp-backend
sudo chown $USER:$USER /opt/faceapp-backend

# Upload your backend folder to /opt/faceapp-backend/
# Then navigate to it
cd /opt/faceapp-backend/backend
```

### **Method 3: Automated Deployment Script**
```bash
#!/bin/bash
# deploy.sh - Automated deployment script

REPO_URL="https://github.com/yourusername/faceapp-backend.git"
DEPLOY_DIR="/opt/faceapp-backend"
BACKUP_DIR="/opt/backups/faceapp-$(date +%Y%m%d_%H%M%S)"

echo "🚀 Starting deployment..."

# Create backup of existing deployment
if [ -d "$DEPLOY_DIR" ]; then
    echo "📦 Creating backup..."
    sudo mkdir -p /opt/backups
    sudo cp -r $DEPLOY_DIR $BACKUP_DIR
fi

# Clone or pull latest code
if [ -d "$DEPLOY_DIR" ]; then
    echo "🔄 Updating existing code..."
    cd $DEPLOY_DIR
    git pull origin main
else
    echo "📥 Cloning repository..."
    sudo git clone $REPO_URL $DEPLOY_DIR
fi

# Set permissions
sudo chown -R $USER:$USER $DEPLOY_DIR
cd $DEPLOY_DIR/backend

echo "✅ Code deployment completed"
```

---

## ⚙️ **Environment Configuration**

### **1. Create Production Environment File**
```bash
# Navigate to backend directory
cd /opt/faceapp-backend/backend

# Create production .env file
cp .env.example .env
# or create new .env file
nano .env
```

### **2. Configure Environment Variables**
```env
# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/faceapp_production
# or for MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/faceapp_production

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_here_min_32_chars
JWT_EXPIRE=7d

# Email Configuration (for production)
EMAIL_FROM=noreply@yourdomain.com
EMAIL_HOST=smtp.yourmailprovider.com
EMAIL_PORT=587
EMAIL_USER=your_email_username
EMAIL_PASS=your_email_password

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dy1tsskkm
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_FOLDER=faceapp-uploads
CLOUDINARY_AUTO_DELETE_DAYS=5

# Performance Configuration
UV_THREADPOOL_SIZE=16
NODE_OPTIONS=--max-old-space-size=2048

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Security
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
ENABLE_COMPRESSION=true

# Monitoring
ENABLE_MONITORING=true
LOG_LEVEL=info
```

### **3. Secure Environment File**
```bash
# Set proper permissions for .env file
chmod 600 .env
chown $USER:$USER .env
```

---

## 📦 **Dependencies Installation**

### **1. Install Node.js Dependencies**
```bash
# Navigate to backend directory
cd /opt/faceapp-backend/backend

# Install production dependencies
npm ci --only=production

# Or install all dependencies (if you need dev tools)
npm install
```

### **2. Install Global Dependencies**
```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Install other global tools (optional)
npm install -g nodemon  # for development
npm install -g pm2-logrotate  # for log management
```

### **3. Verify Dependencies**
```bash
# Check if all dependencies are installed
npm list --depth=0

# Check for vulnerabilities
npm audit

# Fix vulnerabilities if any
npm audit fix
```

---

## 🗄️ **Database Setup**

### **1. MongoDB Installation (if hosting locally)**
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### **2. Create MongoDB Indexes**
```bash
# Navigate to backend directory
cd /opt/faceapp-backend/backend

# Create optimized indexes for performance
npm run db:indexes
```

### **3. Verify Database Connection**
```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/faceapp_production')
  .then(() => { console.log('✅ MongoDB connected'); process.exit(0); })
  .catch(err => { console.error('❌ MongoDB connection failed:', err); process.exit(1); });
"
```

---

## 🚀 **PM2 Setup and Configuration**

### **1. Verify PM2 Configuration**
```bash
# Check if ecosystem.config.js exists
ls -la ecosystem.config.js

# View PM2 configuration
cat ecosystem.config.js
```

### **2. Start Application with PM2**
```bash
# Method 1: Using npm script (Recommended)
npm run pm2:start:prod

# Method 2: Direct PM2 command
pm2 start ecosystem.config.js --env production

# Method 3: Simple start (fallback)
pm2 start server.js --name "faceapp-backend" -i max --env production
```

### **3. Verify PM2 is Running**
```bash
# Check PM2 status
pm2 status

# Expected output: 8 instances of faceapp-backend running
# ┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
# │ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
# ├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
# │ 0  │ faceapp-backend    │ cluster  │ 0    │ online    │ 0%       │ 75mb     │
# │ 1  │ faceapp-backend    │ cluster  │ 0    │ online    │ 0%       │ 78mb     │
# └────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

### **4. Test API Functionality**
```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Expected response:
# {
#   "success": true,
#   "message": "Server is running successfully",
#   "performance": {
#     "status": "healthy"
#   }
# }
```

---

## ⚡ **Auto-Start Configuration**

### **For Linux Servers (Ubuntu/CentOS)**

#### **1. Generate PM2 Startup Script**
```bash
# Generate startup script
pm2 startup

# This will show a command like:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u yourusername --hp /home/yourusername

# Copy and run the exact command it shows
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

#### **2. Save PM2 Process List**
```bash
# Save current PM2 processes
pm2 save

# This saves the process list to ~/.pm2/dump.pm2
```

#### **3. Verify Auto-Start Setup**
```bash
# Check if PM2 service is enabled
systemctl status pm2-$USER

# Check if service will start on boot
systemctl is-enabled pm2-$USER
```

### **For Windows Servers**

#### **Method 1: Windows Service (Recommended)**
```bash
# Install Windows service
npm run windows:service:install

# Start the service
npm run windows:service:start

# Check service status
npm run windows:service:status
```

#### **Method 2: Task Scheduler**
```bash
# Use the provided batch script
# 1. Open Task Scheduler (taskschd.msc)
# 2. Create Basic Task
# 3. Name: "Face Analysis API Auto-Start"
# 4. Trigger: "When the computer starts"
# 5. Action: Start program
# 6. Program: D:\path\to\your\backend\start-faceapp.bat
# 7. Check "Run whether user is logged on or not"
# 8. Check "Run with highest privileges"
```

---

## 🧪 **Testing and Verification**

### **1. PM2 Status Check**
```bash
# Check PM2 processes
pm2 status

# View detailed information
pm2 show faceapp-backend

# Check PM2 logs
pm2 logs faceapp-backend --lines 50
```

### **2. API Health Tests**
```bash
# Basic health check
curl -f http://localhost:3001/api/health

# Test with external IP (replace with your server IP)
curl -f http://YOUR_SERVER_IP:3001/api/health

# Test API endpoints
curl -X GET http://localhost:3001/api/upload/info
```

### **3. Performance Testing**
```bash
# Run performance monitor
npm run monitor

# Load testing (install apache bench first)
sudo apt install apache2-utils  # Ubuntu
ab -n 100 -c 10 http://localhost:3001/api/health
```

### **4. Auto-Start Testing**
```bash
# Test 1: Reboot server
sudo reboot

# After reboot, wait 2 minutes, then check:
pm2 status
curl http://localhost:3001/api/health

# Test 2: PM2 restart simulation
pm2 kill
# Wait 30 seconds
pm2 resurrect
pm2 status
```

### **5. Database Performance Test**
```bash
# Test MongoDB indexes
npm run monitor:mongodb

# Check database connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ DB connected'))
  .catch(err => console.error('❌ DB error:', err));
"
```

---

## 📊 **Monitoring and Maintenance**

### **1. Real-Time Monitoring**
```bash
# PM2 real-time monitor
pm2 monit

# System resource monitoring
htop  # or top

# Check disk usage
df -h

# Check memory usage
free -h
```

### **2. Log Management**
```bash
# View PM2 logs
pm2 logs faceapp-backend

# View specific log files
pm2 logs faceapp-backend --lines 100

# Clear logs
pm2 flush

# Install log rotation
pm2 install pm2-logrotate
```

### **3. Performance Monitoring**
```bash
# Generate performance report
npm run monitor

# Continuous monitoring (every 5 minutes)
npm run monitor:watch

# Check MongoDB performance
npm run monitor:mongodb
```

### **4. Health Checks**
```bash
# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "🏥 Health Check - $(date)"

# Check PM2 status
echo "📊 PM2 Status:"
pm2 jlist | jq -r '.[] | select(.name=="faceapp-backend") | "\(.name): \(.pm2_env.status)"'

# Check API health
echo "🌐 API Health:"
curl -f http://localhost:3001/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ API is healthy"
else
    echo "❌ API is not responding"
fi

# Check disk space
echo "💾 Disk Usage:"
df -h / | tail -1

# Check memory
echo "🧠 Memory Usage:"
free -h | grep Mem

echo "---"
EOF

chmod +x health-check.sh

# Run health check
./health-check.sh

# Schedule health checks (add to crontab)
crontab -e
# Add this line to run every 5 minutes:
# */5 * * * * /opt/faceapp-backend/backend/health-check.sh >> /var/log/faceapp-health.log 2>&1
```

### **5. Backup Strategy**
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/faceapp-$(date +%Y%m%d_%H%M%S)"
SOURCE_DIR="/opt/faceapp-backend"

echo "📦 Creating backup: $BACKUP_DIR"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
cp -r $SOURCE_DIR $BACKUP_DIR/

# Backup MongoDB (if local)
mongodump --db faceapp_production --out $BACKUP_DIR/mongodb/

# Backup PM2 configuration
cp ~/.pm2/dump.pm2 $BACKUP_DIR/

# Compress backup
tar -czf $BACKUP_DIR.tar.gz -C /opt/backups $(basename $BACKUP_DIR)
rm -rf $BACKUP_DIR

echo "✅ Backup completed: $BACKUP_DIR.tar.gz"

# Keep only last 7 backups
find /opt/backups -name "faceapp-*.tar.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Schedule daily backups
crontab -e
# Add this line for daily backup at 2 AM:
# 0 2 * * * /opt/faceapp-backend/backend/backup.sh
```

---

## 🚨 **Troubleshooting**

### **Common Issues and Solutions**

#### **1. PM2 Won't Start**
```bash
# Check PM2 daemon
pm2 ping

# If daemon is not responding
pm2 kill
pm2 start ecosystem.config.js --env production

# Check for port conflicts
netstat -tulpn | grep :3001
lsof -i :3001
```

#### **2. Auto-Start Not Working**
```bash
# Re-configure startup
pm2 unstartup
pm2 startup
# Run the command it shows
pm2 save

# Check systemd service (Linux)
systemctl status pm2-$USER
journalctl -u pm2-$USER -f
```

#### **3. High Memory Usage**
```bash
# Check memory usage per process
pm2 monit

# Restart if memory is too high
pm2 restart faceapp-backend

# Adjust memory limit in ecosystem.config.js
# max_memory_restart: '1G'
```

#### **4. Database Connection Issues**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string
echo $MONGODB_URI

# Test connection
mongo $MONGODB_URI --eval "db.runCommand('ping')"
```

#### **5. API Not Responding**
```bash
# Check if port is open
telnet localhost 3001

# Check firewall (Ubuntu)
sudo ufw status
sudo ufw allow 3001

# Check iptables (CentOS)
sudo iptables -L
sudo firewall-cmd --add-port=3001/tcp --permanent
sudo firewall-cmd --reload
```

#### **6. SSL/HTTPS Issues**
```bash
# Install SSL certificate (using Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Configure nginx as reverse proxy
sudo apt install nginx
```

### **Emergency Recovery**
```bash
# Emergency restart script
cat > emergency-restart.sh << 'EOF'
#!/bin/bash
echo "🚨 Emergency restart initiated"

# Kill all PM2 processes
pm2 kill

# Wait
sleep 5

# Start fresh
cd /opt/faceapp-backend/backend
npm run pm2:start:prod

# Save configuration
pm2 save

echo "✅ Emergency restart completed"
pm2 status
EOF

chmod +x emergency-restart.sh
```

---

## 🔒 **Security Considerations**

### **1. Firewall Configuration**
```bash
# Ubuntu UFW
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 3001  # or your API port
sudo ufw allow 80    # if using HTTP
sudo ufw allow 443   # if using HTTPS

# CentOS/RHEL Firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### **2. Reverse Proxy Setup (Nginx)**
```bash
# Install Nginx
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/faceapp

# Add this configuration:
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/faceapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### **3. SSL Certificate (Let's Encrypt)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### **4. Environment Security**
```bash
# Secure .env file
chmod 600 .env
chown $USER:$USER .env

# Use environment variables for sensitive data
export JWT_SECRET="your-secret-here"
export MONGODB_URI="your-mongodb-uri"

# Add to ~/.bashrc for persistence
echo 'export JWT_SECRET="your-secret-here"' >> ~/.bashrc
```

---

## 📋 **Quick Reference Commands**

### **Deployment Commands**
```bash
# Complete production setup
npm run setup:production

# Start PM2 in production
npm run pm2:start:prod

# Check status
npm run pm2:status

# View logs
npm run pm2:logs

# Monitor performance
npm run monitor

# Restart application
npm run pm2:restart

# Zero-downtime reload
npm run pm2:reload
```

### **Maintenance Commands**
```bash
# Update application
git pull origin main
npm install
npm run pm2:reload

# Database maintenance
npm run db:indexes

# Health check
curl http://localhost:3001/api/health

# Performance report
npm run monitor
```

### **Emergency Commands**
```bash
# Emergency restart
pm2 kill && npm run pm2:start:prod

# Check what's using port 3001
lsof -i :3001

# Check system resources
htop
df -h
free -h
```

---

## 🎉 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Server meets minimum requirements
- [ ] Node.js and npm installed
- [ ] PM2 installed globally
- [ ] MongoDB accessible
- [ ] Domain/IP configured
- [ ] SSL certificate ready (if needed)

### **Deployment**
- [ ] Code deployed to server
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] MongoDB indexes created
- [ ] PM2 started successfully
- [ ] Auto-start configured
- [ ] API responding correctly

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Performance monitoring active
- [ ] Logs configured and rotating
- [ ] Backups scheduled
- [ ] Security measures in place
- [ ] Documentation updated

### **Testing**
- [ ] API endpoints working
- [ ] Database queries fast
- [ ] PM2 clustering active
- [ ] Auto-restart working
- [ ] Server reboot test passed
- [ ] Load testing completed

---

## 🚀 **Success! Your Face Analysis API is Production Ready**

After following this guide, your Face Analysis API will be:

✅ **Running with PM2 clustering** (8 instances)  
✅ **Auto-starting on server boot**  
✅ **Optimized for performance** (53 MongoDB indexes)  
✅ **Monitored and logged**  
✅ **Secured and backed up**  
✅ **Ready for production traffic**  

**Your API can now handle enterprise-level traffic with 99.9% uptime!** 🎯

For support or questions, refer to the troubleshooting section or check the monitoring logs.
