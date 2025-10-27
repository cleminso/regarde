# API Server - Infrastructure & Deployment

## 🚀 Quick Setup (15 minutes)

### Requirements

- Ubuntu 20.04+ VM
- Domain pointing to VM IP (api.regarde.dev)
- Non-root user with sudo access
- Git repository cloned

### Fresh VM Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/regarde.git
cd regarde

# 2. Run bootstrap script to install dependencies
chmod +x packages/api.regarde.dev/deploy/scripts/bootstrap-vm.sh
./packages/api.regarde.dev/deploy/scripts/bootstrap-vm.sh

# 3. Configure environment
cp packages/api.regarde.dev/deploy/config/.env.template packages/api.regarde.dev/.env
nano packages/api.regarde.dev/.env  # Edit with your actual values

# 4. Deploy the application
./packages/api.regarde.dev/deploy/scripts/deploy-production.sh
```

That's it! The deployment script handles everything else automatically.

## 🔄 Simplified Deployment Process

### For Updates (2 commands only!)

```bash
# 1. Pull latest changes
git pull

# 2. Deploy
./packages/api.regarde.dev/deploy/scripts/deploy-production.sh
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

All configuration is centralized in the `.env` file located in `packages/api.regarde.dev/.env`:

> **Note**: The .env file is located in the api.regarde.dev directory (not the project root) so that Bun can automatically load it at runtime using its native .env support.

```bash
# View current configuration
cat packages/api.regarde.dev/.env

# Edit configuration
nano packages/api.regarde.dev/.env

# Template with all options
cat packages/api.regarde.dev/deploy/config/.env.template
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
./packages/api.regarde.dev/deploy/scripts/manage-backups.sh list

# Rollback to previous version
./packages/api.regarde.dev/deploy/scripts/rollback.sh
```

## 📁 Project Structure

```
packages/api.regarde.dev/deploy/
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
  - [ ] Domain DNS pointing to VM IP (api.regarde.dev)
  - [ ] SSH access configured

- [ ] **Repository Setup**
  - [ ] Clone repository: `git clone https://github.com/your-username/regarde.git`
  - [ ] Navigate to project: `cd regarde`
  - [ ] Run bootstrap: `./packages/api.regarde.dev/deploy/scripts/bootstrap-vm.sh`

- [ ] **Configuration**
  - [ ] Copy template: `cp packages/api.regarde.dev/deploy/config/.env.template packages/api.regarde.dev/.env`
  - [ ] Edit configuration: `nano packages/api.regarde.dev/.env`
  - [ ] Set required values: `APP_PUBLIC_HOSTNAME=api.regarde.dev`, `SSL_CERTIFICATE_EMAIL`, Jazz credentials

- [ ] **Deployment**
  - [ ] Run deployment: `./packages/api.regarde.dev/deploy/scripts/deploy-production.sh`
  - [ ] Verify API: `curl -s https://api.regarde.dev/health | jq .`

### Regular Updates

- [ ] Pull changes: `git pull`
- [ ] Deploy: `./packages/api.regarde.dev/deploy/scripts/deploy-production.sh`

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
cat packages/api.regarde.dev/.env

# Check for missing variables
./packages/api.regarde.dev/deploy/scripts/deploy-production.sh

# Reset configuration from template
cp packages/api.regarde.dev/deploy/config/.env.template packages/api.regarde.dev/.env
nano packages/api.regarde.dev/.env
```

### Deployment Issues

```bash
# Check script permissions
ls -la packages/api.regarde.dev/deploy/scripts/

# Test script syntax
bash -n packages/api.regarde.dev/deploy/scripts/deploy-production.sh

# Run deployment with verbose output
bash -x packages/api.regarde.dev/deploy/scripts/deploy-production.sh
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
cp packages/api.regarde.dev/.env ~/api-backups/manual-$TIMESTAMP/
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
./packages/api.regarde.dev/deploy/scripts/deploy-production.sh
```

### Emergency Procedures

```bash
# Quick service restart
sudo systemctl restart nickname-registry

# Emergency rollback
./packages/api.regarde.dev/deploy/scripts/rollback.sh

# Check system resources
df -h
free -h
```

### Maintenance

```bash
# Clean old backups (keeps last 5 by default)
./packages/api.regarde.dev/deploy/scripts/manage-backups.sh clean

# Check backup disk usage
./packages/api.regarde.dev/deploy/scripts/manage-backups.sh size

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
