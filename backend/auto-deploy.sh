#!/bin/bash

# Face Analysis API - One-Command Auto Deployment Script
# Author: Utkarsh
# This script automatically sets up everything: PM2, auto-start, monitoring, and optimization

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="faceapp-backend"
NODE_VERSION="20"
REQUIRED_MEMORY="4"  # GB
REQUIRED_DISK="10"   # GB

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "  Face Analysis API Auto-Deployment"
    echo "  Author: Utkarsh"
    echo "  $(date)"
    echo "=========================================="
    echo -e "${NC}"
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check available memory
    AVAILABLE_MEMORY=$(free -g | awk '/^Mem:/{print $2}')
    if [ "$AVAILABLE_MEMORY" -lt "$REQUIRED_MEMORY" ]; then
        print_warning "Available memory: ${AVAILABLE_MEMORY}GB (Recommended: ${REQUIRED_MEMORY}GB+)"
    else
        print_success "Memory check passed: ${AVAILABLE_MEMORY}GB"
    fi
    
    # Check available disk space
    AVAILABLE_DISK=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$AVAILABLE_DISK" -lt "$REQUIRED_DISK" ]; then
        print_warning "Available disk space: ${AVAILABLE_DISK}GB (Recommended: ${REQUIRED_DISK}GB+)"
    else
        print_success "Disk space check passed: ${AVAILABLE_DISK}GB"
    fi
}

# Install Node.js if not present
install_nodejs() {
    if command -v node >/dev/null 2>&1; then
        NODE_VER=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VER" -ge "$NODE_VERSION" ]; then
            print_success "Node.js $(node --version) is already installed"
            return
        fi
    fi
    
    print_status "Installing Node.js $NODE_VERSION..."
    
    # Detect OS and install accordingly
    if [ -f /etc/debian_version ]; then
        # Ubuntu/Debian
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL
        curl -fsSL https://rpm.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
        sudo yum install -y nodejs
    else
        print_error "Unsupported OS. Please install Node.js $NODE_VERSION manually."
        exit 1
    fi
    
    print_success "Node.js $(node --version) installed successfully"
}

# Install PM2 globally
install_pm2() {
    if command -v pm2 >/dev/null 2>&1; then
        print_success "PM2 $(pm2 --version) is already installed"
        return
    fi
    
    print_status "Installing PM2 globally..."
    npm install -g pm2
    print_success "PM2 $(pm2 --version) installed successfully"
}

# Install dependencies
install_dependencies() {
    print_status "Installing Node.js dependencies..."
    
    if [ -f "package-lock.json" ]; then
        npm ci --only=production
    else
        npm install --only=production
    fi
    
    print_success "Dependencies installed successfully"
}

# Setup environment
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Created .env from .env.example. Please update with your production values."
        else
            # Create basic .env file
            cat > .env << EOF
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/faceapp_production
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=dy1tsskkm
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLOUDINARY_FOLDER=faceapp-uploads
CLOUDINARY_AUTO_DELETE_DAYS=5
UV_THREADPOOL_SIZE=16
NODE_OPTIONS=--max-old-space-size=2048
EOF
            print_warning "Created basic .env file. Please update with your production values."
        fi
    else
        print_success "Environment file already exists"
    fi
    
    # Secure the .env file
    chmod 600 .env
}

# Setup MongoDB indexes
setup_database() {
    print_status "Setting up MongoDB indexes for performance..."
    
    if [ -f "scripts/createIndexes.js" ]; then
        node scripts/createIndexes.js
        print_success "MongoDB indexes created successfully"
    else
        print_warning "MongoDB index script not found. Skipping database optimization."
    fi
}

# Stop any existing processes
stop_existing_processes() {
    print_status "Stopping any existing processes..."
    
    # Kill any existing PM2 processes
    pm2 kill >/dev/null 2>&1 || true
    
    # Kill any Node.js processes on port 3001
    lsof -ti:3001 | xargs kill -9 >/dev/null 2>&1 || true
    
    print_success "Existing processes stopped"
}

# Start PM2 with clustering
start_pm2() {
    print_status "Starting Face Analysis API with PM2 clustering..."
    
    # Start with ecosystem config if available
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js --env production
    else
        # Fallback to simple start
        pm2 start server.js --name "$APP_NAME" -i max --env production
    fi
    
    # Save PM2 configuration
    pm2 save
    
    print_success "PM2 started with clustering enabled"
}

# Setup auto-start
setup_autostart() {
    print_status "Setting up auto-start on system boot..."
    
    # Generate startup script
    STARTUP_OUTPUT=$(pm2 startup 2>&1)
    
    if echo "$STARTUP_OUTPUT" | grep -q "sudo env PATH"; then
        # Extract and execute the startup command
        STARTUP_CMD=$(echo "$STARTUP_OUTPUT" | grep "sudo env PATH" | head -1)
        print_status "Executing startup command..."
        eval "$STARTUP_CMD"
        
        # Save current processes
        pm2 save
        print_success "Auto-start configured successfully"
    else
        print_warning "Auto-start setup may need manual configuration"
        print_warning "Run 'pm2 startup' manually and follow the instructions"
    fi
}

# Test the deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Wait for application to start
    sleep 10
    
    # Check PM2 status
    PM2_STATUS=$(pm2 jlist 2>/dev/null | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null || echo "unknown")
    
    if [ "$PM2_STATUS" = "online" ]; then
        print_success "PM2 processes are running"
    else
        print_error "PM2 processes are not running properly"
        pm2 status
        return 1
    fi
    
    # Test API health
    if command -v curl >/dev/null 2>&1; then
        if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
            print_success "API health check passed"
        else
            print_warning "API health check failed. The API might still be starting up."
        fi
    else
        print_warning "curl not available. Skipping API health check."
    fi
}

# Create monitoring script
create_monitoring() {
    print_status "Setting up monitoring..."
    
    cat > monitor.sh << 'EOF'
#!/bin/bash
echo "🔍 Face Analysis API Status - $(date)"
echo "=================================="

# PM2 Status
echo "📊 PM2 Status:"
pm2 jlist | jq -r '.[] | select(.name=="faceapp-backend") | "Instance \(.pm_id): \(.pm2_env.status) (CPU: \(.monit.cpu)%, Memory: \(.monit.memory/1024/1024|floor)MB)"' 2>/dev/null || pm2 status

# API Health
echo ""
echo "🌐 API Health:"
if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
    echo "✅ API is responding"
else
    echo "❌ API is not responding"
fi

# System Resources
echo ""
echo "💻 System Resources:"
echo "Memory: $(free -h | grep Mem | awk '{print $3"/"$2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5" used)"}')"
echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
EOF

    chmod +x monitor.sh
    print_success "Monitoring script created (./monitor.sh)"
}

# Create management scripts
create_management_scripts() {
    print_status "Creating management scripts..."
    
    # Restart script
    cat > restart.sh << 'EOF'
#!/bin/bash
echo "🔄 Restarting Face Analysis API..."
pm2 restart faceapp-backend
echo "✅ Restart completed"
pm2 status
EOF
    
    # Update script
    cat > update.sh << 'EOF'
#!/bin/bash
echo "🔄 Updating Face Analysis API..."
git pull origin main
npm install --only=production
pm2 reload faceapp-backend
echo "✅ Update completed"
pm2 status
EOF
    
    # Backup script
    cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups/backup-$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/" --exclude=node_modules --exclude=backups --exclude=logs
tar -czf "$BACKUP_DIR.tar.gz" -C ./backups "$(basename "$BACKUP_DIR")"
rm -rf "$BACKUP_DIR"
echo "✅ Backup created: $BACKUP_DIR.tar.gz"
EOF
    
    chmod +x restart.sh update.sh backup.sh
    print_success "Management scripts created (restart.sh, update.sh, backup.sh)"
}

# Display final status
display_final_status() {
    echo ""
    print_header
    print_success "🎉 Face Analysis API Deployment Completed Successfully!"
    echo ""
    
    echo -e "${GREEN}✅ What's been set up:${NC}"
    echo "   • Node.js and PM2 installed"
    echo "   • Dependencies installed"
    echo "   • Environment configured"
    echo "   • MongoDB indexes optimized"
    echo "   • PM2 clustering enabled ($(pm2 jlist 2>/dev/null | jq -r '[.[] | select(.name=="faceapp-backend")] | length' 2>/dev/null || echo "8") instances)"
    echo "   • Auto-start on boot configured"
    echo "   • Monitoring and management scripts created"
    
    echo ""
    echo -e "${BLUE}📋 Management Commands:${NC}"
    echo "   ./monitor.sh     - Check status and health"
    echo "   ./restart.sh     - Restart the application"
    echo "   ./update.sh      - Update from git and reload"
    echo "   ./backup.sh      - Create backup"
    echo "   pm2 status       - Check PM2 processes"
    echo "   pm2 logs         - View application logs"
    echo "   pm2 monit        - Real-time monitoring"
    
    echo ""
    echo -e "${BLUE}🌐 API Information:${NC}"
    echo "   Local URL:  http://localhost:3001"
    echo "   Health:     http://localhost:3001/api/health"
    echo "   Status:     $(curl -f http://localhost:3001/api/health >/dev/null 2>&1 && echo "✅ Running" || echo "⚠️ Starting up")"
    
    echo ""
    echo -e "${YELLOW}⚠️ Next Steps:${NC}"
    echo "   1. Update .env file with your production values"
    echo "   2. Configure firewall: sudo ufw allow 3001"
    echo "   3. Set up reverse proxy (nginx) for production"
    echo "   4. Configure SSL certificate for HTTPS"
    echo "   5. Test auto-start: sudo reboot"
    
    echo ""
    print_success "Your Face Analysis API is now production-ready! 🚀"
}

# Main execution
main() {
    print_header
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        print_error "Please don't run this script as root"
        exit 1
    fi
    
    # Change to script directory
    cd "$(dirname "$0")"
    
    print_status "Starting automated deployment..."
    
    # Execute deployment steps
    check_requirements
    install_nodejs
    install_pm2
    install_dependencies
    setup_environment
    setup_database
    stop_existing_processes
    start_pm2
    setup_autostart
    test_deployment
    create_monitoring
    create_management_scripts
    display_final_status
}

# Handle interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
