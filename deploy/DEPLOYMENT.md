# CIM Deployment Guide

## Server Configuration
- **Application Server**: 10.100.60.111 (CentOS)
- **PostgreSQL Server**: 10.100.60.113 (Ubuntu)
- **Application Directory**: /home/project/cim
- **Subdomain**: cim.phoneme.in
- **Backend Port**: 8001 (to avoid conflict with hisaab on 8000)

## Prerequisites: DNS Setup

**Before deployment**, add a DNS A record for the subdomain:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | cim | 10.100.60.111 | 300 |

Verify DNS propagation:
```bash
nslookup cim.phoneme.in
# or
ping cim.phoneme.in
```

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. SSH into the application server:
```bash
ssh root@10.100.60.111
# Password: indian@123
```

2. Navigate to the project and run deployment script:
```bash
cd /home/project/cim
git pull origin main
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

### Option 2: Manual Deployment

#### Step 1: Pull Latest Code
```bash
cd /home/project/cim
git fetch origin
git reset --hard origin/main
git pull origin main
```

#### Step 2: Setup Backend
```bash
cd /home/project/cim/server

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file
cp ../deploy/.env.server.example .env
# Edit .env and add your GEMINI_API_KEY
nano .env

# Create uploads directory
mkdir -p uploads
```

#### Step 3: Build Frontend
```bash
cd /home/project/cim/client
npm install
npm run build
```

#### Step 4: Setup Systemd Service
```bash
# Copy service file
sudo cp /home/project/cim/deploy/cim-api.service /etc/systemd/system/

# Reload and start
sudo systemctl daemon-reload
sudo systemctl enable cim-api
sudo systemctl start cim-api

# Check status
sudo systemctl status cim-api
```

#### Step 5: Setup Nginx
```bash
# Copy nginx config
sudo cp /home/project/cim/deploy/cim-nginx.conf /etc/nginx/conf.d/cim.conf

# Test and reload (not restart, to avoid affecting other sites)
sudo nginx -t
sudo systemctl reload nginx
```

## Port Configuration Summary

| Service | Port | Usage |
|---------|------|-------|
| hisaab backend | 8000 | Existing - DO NOT USE |
| **CIM backend** | **8001** | New - CIM FastAPI |
| phoneme workspace | 3001 | Existing |
| phoneme frontend | 5173 | Existing (dev) |

## Useful Commands

### View Logs
```bash
# CIM FastAPI logs
journalctl -u cim-api -f

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
sudo systemctl restart cim-api
sudo systemctl reload nginx
```

### Check Service Status
```bash
sudo systemctl status cim-api
sudo systemctl status nginx
```

### Test Backend Directly
```bash
curl http://localhost:8001/api/health
curl http://localhost:8001/
```

### Check Ports
```bash
ss -tlnp | grep -E "8001|80"
lsof -i :8001
```

## PostgreSQL Setup (Optional)

If you want to use PostgreSQL instead of SQLite:

1. SSH to PostgreSQL server:
```bash
ssh root@10.100.60.113
```

2. Create database:
```bash
sudo -u postgres psql
CREATE DATABASE cim;
CREATE USER cim_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cim TO cim_user;
\q
```

3. Update .env on application server:
```bash
DATABASE_URL=postgresql://cim_user:your_password@10.100.60.113:5432/cim
```

4. Install psycopg2:
```bash
cd /home/project/cim/server
source venv/bin/activate
pip install psycopg2-binary
```

5. Restart the service:
```bash
sudo systemctl restart cim-api
```

## Troubleshooting

### DNS Not Resolving
- Wait 5-30 minutes for DNS propagation
- Check with: `nslookup cim.phoneme.in`
- Temporarily test using IP: add to nginx `server_name cim.phoneme.in 10.100.60.111;`

### Port Already in Use
```bash
# Find process using port 8001
lsof -i :8001
# Kill the process
kill -9 <PID>
```

### Permission Denied
```bash
# Fix permissions
chmod -R 755 /home/project/cim
chown -R root:root /home/project/cim
```

### Database Issues
```bash
# Reset SQLite database
cd /home/project/cim/server
rm database.sqlite
systemctl restart cim-api
```

### SELinux Issues (CentOS)
```bash
# Allow nginx to connect to backend
setsebool -P httpd_can_network_connect 1

# Allow nginx to serve static files
chcon -R -t httpd_sys_content_t /home/project/cim/client/dist
```

### CORS Errors
Ensure .env has correct CORS_ORIGINS:
```bash
CORS_ORIGINS=["http://cim.phoneme.in","https://cim.phoneme.in"]
```
Then restart: `systemctl restart cim-api`
