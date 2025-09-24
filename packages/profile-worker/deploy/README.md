# Nickname Registry - Infrastructure & Deployment

## 🚀 Quick Setup (30 minutes)

### Requirements

- Ubuntu 20.04+

- Domain pointing to VM IP

- Email for SSL certificates

### Fresh VM Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/onboarding.jazz.git
cd onboarding.jazz/packages/profile-worker

# 2. Run bootstrap script
chmod +x deploy/scripts/bootstrap-vm.sh
./deploy/scripts/bootstrap-vm.sh

# 3. Configure environment
nano .env

# 4. Restart service
sudo systemctl restart nickname-registry

# 5. Verify setup
curl -s https://api.regarde.bio/health | jq .
```

## Post-Setup Verification

### Quick Health Check

```
# Verify service is running
sudo systemctl status nickname-registry

# Test API health
curl -s https://api.regarde.bio/health | jq .

# Check SSL certificate
sudo certbot certificates

# Test management scripts
./manage-backups.sh list
```

### Test Management Scripts

```
# List backups
./manage-backups.sh list

# Check backup size
./manage-backups.sh size

# Test deployment (dry run)
git status  # Should show clean working directory
```

### Management Commandes

# Deploy new version

`./deploy-production.sh`

# Check status

`sudo systemctl status nickname-registry`

# View logs

`sudo journalctl -u nickname-registry -f`

# Rollback if needed

`./rollback.sh`

# Manage backups

```
./manage-backups.sh list
./manage-backups.sh clean
./manage-backups.sh size
```

### File Infrastructure

deploy/
├── scripts/
│ ├── bootstrap-vm.sh # VM setup from scratch
│ ├── deploy-production.sh # Production deployment
│ ├── rollback.sh # Rollback tool
│ └── manage-backups.sh # Backup management
├── config/
│ ├── nginx.conf # Nginx configuration
│ ├── systemd.service # Systemd service template
│ └── .env.template # Environment template
└── README.md # This file

### Deployment Checklist

```
VM Setup**
  - [ ] VM created and accessible via SSH
  - [ ] Domain DNS pointing to VM IP
  - [ ] SSH key configured

- [ ] **Initial Setup**
  - [ ] Clone repository: `git clone https://github.com/your-username/onboarding.jazz.git`
  - [ ] Navigate to project: `cd onboarding.jazz/packages/profile-worker`
  - [ ] Run bootstrap: `./deploy/scripts/bootstrap-vm.sh`

- [ ] **Configuration**
  - [ ] Edit environment file: `nano .env`
  - [ ] Restart service: `sudo systemctl restart nickname-registry`

- [ ] **Verification**
  - [ ] Test API: `curl -s https://api.regarde.bio/health | jq .`
  - [ ] Check service: `sudo systemctl status nickname-registry`
  - [ ] Verify SSL: `sudo certbot certificates
```

## Troubleshooting

```
sudo journalctl -u nickname-registry -f
sudo systemctl status nickname-registry
```

### SSL Certificate Issues

```
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal (if needed)
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### Nginx Configuration Issues

```
# Test configuration
sudo nginx -t

# Check nginx status
sudo systemctl status nginx

# View nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

`chmod +x deploy/scripts/*.sh` - make all scripts executable

### Environment Issues

```
# Check environment file
cat .env

# Verify service can read environment
sudo systemctl cat nickname-registry

# Check project dependencies
pnpm install
```

### Test the Implementation

```
# 1. Verify all scripts are executable
ls -la deploy/scripts/

# 2. Test script syntax
bash -n deploy/scripts/bootstrap-vm.sh
bash -n deploy/scripts/deploy-production.sh
bash -n deploy/scripts/rollback.sh
bash -n deploy/scripts/manage-backups.sh

# 3. Test backup management
deploy/scripts/manage-backups.sh

# 4. Copy scripts to home directory for easy access
cp deploy/scripts/deploy-production.sh ~/
cp deploy/scripts/rollback.sh ~/
cp deploy/scripts/manage-backups.sh ~/
chmod +x ~/*.sh
```

## Advanced Operations

### Manuel Backup Creation

```
# Create manual backup before risky changes
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p ~/api-backups/manual-$TIMESTAMP
cp -r src/ ~/api-backups/manual-$TIMESTAMP/
cp package.json ~/api-backups/manual-$TIMESTAMP/
cp .env ~/api-backups/manual-$TIMESTAMP/
```

### Service Management

```
# Enable service (start on boot)
sudo systemctl enable nickname-registry

# Disable service
sudo systemctl disable nickname-registry

# Check if service is enabled
sudo systemctl is-enabled nickname-registry

# View service configuration
sudo systemctl cat nickname-registry
```

### Update Infrastructure

```
# Update deployment scripts
git pull origin main
cp deploy/scripts/*.sh ~/
chmod +x ~/*.sh

# Update service configuration
sudo cp deploy/config/systemd.service /etc/systemd/system/nickname-registry.service
sudo systemctl daemon-reload
sudo systemctl restart nickname-registry
```

### Service Down

```
# Quick restart
sudo systemctl restart nickname-registry

# If restart fails, check logs
sudo journalctl -u nickname-registry -n 20

# Emergency rollback
./rollback.sh
```

### Disk Space Issues

```
# Check disk usage
df -h

# Clean old backups
./manage-backups.sh clean

# Clear system logs
sudo journalctl --vacuum-time=30d
```
