# Profile Worker - Infrastructure & Deployment

## 🚀 Quick Setup (15 minutes)

### Requirements

- Ubuntu 20.04+ VM
- Domain pointing to VM IP
- Non-root user with sudo access
- Git repository cloned

### Fresh VM Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/onboarding.jazz.git
cd onboarding.jazz

# 2. Run bootstrap script to install dependencies
chmod +x packages/profile-worker/deploy/scripts/bootstrap-vm.sh
./packages/profile-worker/deploy/scripts/bootstrap-vm.sh

# 3. Configure environment
cp packages/profile-worker/deploy/config/.env.template packages/profile-worker/.env
nano packages/profile-worker/.env  # Edit with your actual values

# 4. Deploy the application
./packages/profile-worker/deploy/scripts/deploy-production.sh
```

That's it! The deployment script handles everything else automatically.

## 🔄 Simplified Deployment Process

### For Updates (2 commands only!)

```bash
# 1. Pull latest changes
git pull

# 2. Deploy
./packages/profile-worker/deploy/scripts/deploy-production.sh
```

The deployment script automatically:
- ✅ Validates configuration
- ✅ Creates backups
- ✅ Updates dependencies
- ✅ Builds the project
- ✅ Restarts services
- ✅ Runs health checks
- ✅ Cleans up old backups

### Configuration Management

All configuration is centralized in the `.env` file located in `packages/profile-worker/.env`:

> **Note**: The .env file is located in the profile-worker directory (not the project root) so that Bun can automatically load it at runtime using its native .env support.

```bash
# View current configuration
cat packages/profile-worker/.env

# Edit configuration
nano packages/profile-worker/.env

# Template with all options
cat packages/profile-worker/deploy/config/.env.template
```

### Management Commands

```bash
# Check service status
sudo systemctl status nickname-registry  # (or your SERVICE_NAME)

# View logs
sudo journalctl -u nickname-registry -f

# Test API health
curl -s https://your-domain.com/health | jq .

# List backups
./packages/profile-worker/deploy/scripts/manage-backups.sh list

# Rollback to previous version
./packages/profile-worker/deploy/scripts/rollback.sh
```

## 📁 Project Structure

```
packages/profile-worker/deploy/
├── scripts/
│   ├── bootstrap-vm.sh        # Install system dependencies
│   ├── deploy-production.sh   # Main deployment script
│   ├── rollback.sh           # Rollback to previous version
│   └── manage-backups.sh     # Backup management
├── config/
│   ├── nginx.conf            # Nginx template (parameterized)
│   ├── systemd.service       # Systemd service template
│   └── .env.template         # Environment configuration template
└── README.md                 # This documentation
```

## ✅ Deployment Checklist

### Initial Setup
- [ ] **VM Preparation**
  - [ ] Ubuntu 20.04+ VM created
  - [ ] Domain DNS pointing to VM IP
  - [ ] SSH access configured

- [ ] **Repository Setup**
  - [ ] Clone repository: `git clone https://github.com/your-username/onboarding.jazz.git`
  - [ ] Navigate to project: `cd onboarding.jazz`
  - [ ] Run bootstrap: `./packages/profile-worker/deploy/scripts/bootstrap-vm.sh`

- [ ] **Configuration**
  - [ ] Copy template: `cp packages/profile-worker/deploy/config/.env.template packages/profile-worker/.env`
  - [ ] Edit configuration: `nano packages/profile-worker/.env`
  - [ ] Set required values: `APP_PUBLIC_HOSTNAME`, `SSL_CERTIFICATE_EMAIL`, Jazz credentials

- [ ] **Deployment**
  - [ ] Run deployment: `./packages/profile-worker/deploy/scripts/deploy-production.sh`
  - [ ] Verify API: `curl -s https://your-domain.com/health | jq .`

### Regular Updates
- [ ] Pull changes: `git pull`
- [ ] Deploy: `./packages/profile-worker/deploy/scripts/deploy-production.sh`

## 📋 Logging System

All deployment scripts use a consistent logging system that provides clear, color-coded output without emojis for better compatibility:

### Log Levels
- `[SUCCESS]` - Operations completed successfully (green)
- `[FAILED]` - Operations that failed (red)
- `[ERROR]` - Error conditions (red)
- `[WARNING]` - Warning conditions (yellow)
- `[INFO]` - Informational messages (cyan)
- `[STATUS]` - Status updates (yellow)
- `[CHECK]` - Validation steps (blue)
- `[STEP]` - Process steps (blue)
- `[PROGRESS]` - Progress indicators (cyan)
- `[COMPLETE]` - Completion messages (green)
- `[DEBUG]` - Debug information (gray)

### Status Indicators
- `[OK]` - Healthy/working status (green)
- `[ERROR]` - Error status (red)
- `[WARN]` - Warning status (yellow)
- `[MISSING]` - Missing components (red)
- `[INACTIVE]` - Inactive services (gray)
- `[UNKNOWN]` - Unknown status (cyan)

This logging system matches the TypeScript Logger class used in other parts of the application for consistency.

## 🔧 Troubleshooting

### Service Issues
```bash
# Check service status
sudo systemctl status nickname-registry  # (or your SERVICE_NAME)

# View recent logs
sudo journalctl -u nickname-registry -n 50

# Follow logs in real-time
sudo journalctl -u nickname-registry -f

# Restart service
sudo systemctl restart nickname-registry
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### Configuration Issues
```bash
# Validate .env file
cat packages/profile-worker/.env

# Check for missing variables
./packages/profile-worker/deploy/scripts/deploy-production.sh

# Reset configuration from template
cp packages/profile-worker/deploy/config/.env.template packages/profile-worker/.env
nano packages/profile-worker/.env
```

### Deployment Issues
```bash
# Check script permissions
ls -la packages/profile-worker/deploy/scripts/

# Test script syntax
bash -n packages/profile-worker/deploy/scripts/deploy-production.sh

# Run deployment with verbose output
bash -x packages/profile-worker/deploy/scripts/deploy-production.sh
```

## 🚀 Advanced Operations

### Manual Backup Creation
```bash
# Create manual backup before risky changes
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
SERVICE_NAME=${SERVICE_NAME:-"nickname-registry"}
mkdir -p ~/api-backups/manual-$TIMESTAMP
cp -r src/ ~/api-backups/manual-$TIMESTAMP/
cp package.json ~/api-backups/manual-$TIMESTAMP/
cp packages/profile-worker/.env ~/api-backups/manual-$TIMESTAMP/
echo "Manual backup created at: $(date)" > ~/api-backups/manual-$TIMESTAMP/backup_info.txt
```

### Service Management
```bash
# Enable service (start on boot)
sudo systemctl enable nickname-registry

# Disable service
sudo systemctl disable nickname-registry

# Check if service is enabled
sudo systemctl is-enabled nickname-registry

# View service configuration
sudo systemctl cat nickname-registry
```

### Infrastructure Updates
```bash
# Update deployment infrastructure
git pull

# The deployment script automatically uses the latest configuration templates
./packages/profile-worker/deploy/scripts/deploy-production.sh
```

### Emergency Procedures
```bash
# Quick service restart
sudo systemctl restart nickname-registry

# Emergency rollback
./packages/profile-worker/deploy/scripts/rollback.sh

# Check system resources
df -h
free -h
```

### Maintenance
```bash
# Clean old backups (keeps last 5 by default)
./packages/profile-worker/deploy/scripts/manage-backups.sh clean

# Check backup disk usage
./packages/profile-worker/deploy/scripts/manage-backups.sh size

# Clear system logs (keep last 30 days)
sudo journalctl --vacuum-time=30d
```

## 🔑 Key Improvements

This refactored deployment system provides:

- **Simplified Process**: Just 2 commands for deployment (`git pull` + `deploy-production.sh`)
- **Parameterized Configuration**: All domain and service settings in `.env` file
- **No Script Copying**: Scripts run from their original location
- **Automatic Setup Detection**: Handles both initial setup and updates
- **Better Error Handling**: Comprehensive validation and error messages
- **Centralized Configuration**: Single source of truth for all settings
- **Backward Compatibility**: Preserves existing functionality while simplifying usage
