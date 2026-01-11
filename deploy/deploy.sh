#!/bin/bash

# CIM Deployment Script for CentOS
# Subdomain: cim.phoneme.in
# Backend Port: 8001 (avoiding conflict with hisaab on 8000)
# Application directory: /home/project/cim
# Run as root

set -e

APP_DIR="/home/project/cim"
BACKEND_PORT=8001

echo "=========================================="
echo "CIM Deployment Script"
echo "Subdomain: cim.phoneme.in"
echo "Backend Port: $BACKEND_PORT"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root"
    exit 1
fi

# Navigate to application directory
cd $APP_DIR

echo ""
echo "Step 1: Checking existing CIM service..."
echo "------------------------------------------"

# Stop existing CIM service if running
if systemctl is-active --quiet cim-api 2>/dev/null; then
    print_warning "Stopping existing cim-api service..."
    systemctl stop cim-api
    sleep 2
fi

# Check if port 8001 is in use by something else
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_warning "Port $BACKEND_PORT is in use. Attempting to free it..."
    pkill -f "uvicorn.*8001" 2>/dev/null || true
    sleep 2
fi

print_status "Port check complete"

echo ""
echo "Step 2: Pulling latest code from GitHub..."
echo "------------------------------------------"

git fetch origin
git reset --hard origin/main
git pull origin main

print_status "Code updated from GitHub"

echo ""
echo "Step 3: Setting up Python virtual environment..."
echo "------------------------------------------"

cd $APP_DIR/server

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_status "Virtual environment created"
else
    print_status "Virtual environment exists"
fi

# Activate virtual environment and install dependencies
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

print_status "Python dependencies installed"

echo ""
echo "Step 4: Creating .env file for backend..."
echo "------------------------------------------"

# Create .env file if not exists
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
GEMINI_API_KEY=your-gemini-api-key-here
JWT_SECRET=cims-production-secret-key-change-this
ADMIN_EMAIL=phoneme2016@gmail.com
ADMIN_PASSWORD=Solution@1979
CORS_ORIGINS=["http://cim.phoneme.in","https://cim.phoneme.in","http://localhost:5173"]
DATABASE_URL=sqlite:///./database.sqlite
EOF
    print_warning ".env file created - Please update GEMINI_API_KEY!"
else
    print_status ".env file exists"
fi

# Create uploads directory
mkdir -p uploads
chmod 755 uploads

echo ""
echo "Step 5: Building React frontend..."
echo "------------------------------------------"

cd $APP_DIR/client

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Installing..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
    yum install -y nodejs
fi

# Install npm dependencies and build
npm install
npm run build

print_status "Frontend build complete"

echo ""
echo "Step 6: Setting up systemd service for FastAPI..."
echo "------------------------------------------"

# Copy systemd service file
cp $APP_DIR/deploy/cim-api.service /etc/systemd/system/cim-api.service

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable cim-api
systemctl restart cim-api

sleep 3

# Check if service is running
if systemctl is-active --quiet cim-api; then
    print_status "FastAPI service is running on port $BACKEND_PORT"
else
    print_error "FastAPI service failed to start"
    systemctl status cim-api
fi

echo ""
echo "Step 7: Setting up Nginx for cim.phoneme.in..."
echo "------------------------------------------"

# Copy nginx config (does NOT affect hisaab or other configs)
cp $APP_DIR/deploy/cim-nginx.conf /etc/nginx/conf.d/cim.conf

# Test nginx config
nginx -t

# Reload nginx (not restart, to avoid downtime for other sites)
systemctl reload nginx

print_status "Nginx configured for cim.phoneme.in"

echo ""
echo "=========================================="
echo "Deployment Complete!"
echo "=========================================="
echo ""
echo "Application URL: http://cim.phoneme.in"
echo "Backend API: http://cim.phoneme.in/api"
echo "Backend Port: $BACKEND_PORT (internal)"
echo ""
echo "IMPORTANT - DNS Setup Required:"
echo "  Add DNS A record: cim -> 10.100.60.111"
echo ""
echo "Commands to check status:"
echo "  - systemctl status cim-api"
echo "  - journalctl -u cim-api -f (view logs)"
echo "  - curl http://localhost:8001/api/health"
echo ""
echo "Don't forget to update GEMINI_API_KEY in:"
echo "  /home/project/cim/server/.env"
echo ""
