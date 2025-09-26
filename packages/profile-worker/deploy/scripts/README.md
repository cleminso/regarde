# Deployment Scripts

This directory contains deployment and utility scripts for the Profile Worker service.

## Main Script: deploy-production.sh

A unified deployment script that handles both regular deployments and rollbacks to specific versions.

### Usage

```bash
# Deploy current code (most common usage)
./deploy-production.sh

# Deploy from specific commit (rollback)
./deploy-production.sh --from-commit abc123

# Deploy from specific tag
./deploy-production.sh --from-tag v1.2.3

# Fast deployment without health checks
./deploy-production.sh --skip-checks

# Combine options
./deploy-production.sh --from-commit abc123 --skip-checks
```

### How It Works

1. **Regular Deployment** (no version flags):
   - Uses the current code in your working directory
   - Installs dependencies
   - Builds the project
   - Restarts the service
   - Runs health check (unless skipped)

2. **Version-specific Deployment** (with --from-commit or --from-tag):
   - Requires clean git working directory
   - Resets code to specified version
   - Then follows regular deployment process

### Examples

```bash
# Deploy latest code after making changes
git add .
git commit -m "Fix bug in profile handler"
./deploy-production.sh

# Quick rollback to previous commit
./deploy-production.sh --from-commit HEAD~1

# Deploy a specific release
./deploy-production.sh --from-tag v2.1.0

# Fast rollback without health checks
./deploy-production.sh --from-commit abc123 --skip-checks
```

## Supporting Scripts

### bootstrap-vm.sh
Initial VM setup - installs required dependencies (nginx, certbot, Node.js, pnpm, etc.)

### logger.sh
Logging utilities used by other scripts for consistent output formatting.

## Configuration

All scripts require a `.env` file in the profile-worker directory with the following variables:

- `APP_PUBLIC_HOSTNAME` - Domain name for the service
- `JAZZ_WORKER_ACCOUNT` - Jazz worker account ID
- `JAZZ_WORKER_SECRET` - Jazz worker secret key
- `JAZZ_SYNC_SERVER_URL` - Jazz sync server URL
- `ACCOUNT_ADMIN_ID` - Account admin ID
- `SSL_CERTIFICATE_EMAIL` - (Optional) Email for SSL certificate

## Best Practices

1. **Always commit before deployment**: Keep your git history clean
2. **Tag releases**: Use `git tag v1.0.0` for important versions
3. **Test locally first**: Ensure code works before deploying
4. **Monitor after deployment**: Check logs with `sudo journalctl -u nickname-registry -f`

## Quick Commands

```bash
# Check service status
sudo systemctl status nickname-registry

# View logs
sudo journalctl -u nickname-registry -f

# Test health endpoint
curl -s https://your-domain.com/health | jq .

# List available versions for rollback
git log --oneline -10  # Recent commits
git tag -l             # Available tags
```

## Rollback Strategy

If something goes wrong after deployment:

1. **Quick rollback**: `./deploy-production.sh --from-commit HEAD~1`
2. **Specific version**: `./deploy-production.sh --from-tag last-known-good`
3. **Manual recovery**:
   ```bash
   git reset --hard <good-commit>
   ./deploy-production.sh
   ```

The unified script approach keeps things simple - one script handles all deployment scenarios.
