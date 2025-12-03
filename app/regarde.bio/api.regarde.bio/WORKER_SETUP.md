# ProfileWorkerAccount Setup Guide

This guide explains how to generate a new worker account ID and secret for api.regarde.bio.

## Quick Start

```bash
# 1. Generate worker credentials
npx jazz-run account create --name "ProfileWorkerAccount"

# 2. Copy the output to your .env file
# PROFILE_WORKER_ACCOUNT=co_z...
# PROFILE_WORKER_SECRET=sealerSecret_z.../signerSecret_z...

# 3. Update src/index.ts to use the credentials (see Step 4 below)

# 4. Test it
pnpm dev
```

## Background

api.regarde.bio uses a `ProfileWorkerAccount` to load user profiles (RegardeAccount and RegardeProfile). This is separate from the `RegistryWorkerAccount` used by api.regarde.dev.

**Why separate workers?**
- **Security**: api.regarde.bio doesn't need write access to nickname registries
- **Separation of concerns**: Each service has its own worker with appropriate permissions
- **Independence**: Services can be deployed/scaled independently

## Manual Worker Account Generation

### Step 1: Generate Worker Credentials Using Jazz CLI

The recommended way to generate worker credentials is using the Jazz CLI:

```bash
npx jazz-run account create --name "ProfileWorkerAccount"
```

This will output both the **Account ID** and **Account Secret**:

```
Account created successfully!

Account ID: co_zXXXXXXXXXXXXXXXXXXXXXXXXXX
Account Secret: sealerSecret_zYYYYYYYYYYYYYYYYYYYYYYYYYY/signerSecret_zZZZZZZZZZZZZZZZZZZZZZZZZZZ

Save these credentials securely!
```

**Important:**
- The Account ID is public and identifies the worker
- The Account Secret is private and must be kept secure (never commit to git)
- Both are needed to run the worker

### Step 2: Save the Credentials

**Copy both values** - you'll need them for the next steps.

### Step 3: Update Environment Variables

Add both the worker account ID and secret to your `.env` file:

```bash
# packages/api.regarde.bio/.env
PROFILE_WORKER_ACCOUNT=co_zXXXXXXXXXXXXXXXXXXXXXXXXXX
PROFILE_WORKER_SECRET=sealerSecret_zYYYYYYYYYYYYYYYYYYYYYYYYYY/signerSecret_zZZZZZZZZZZZZZZZZZZZZZZZZZZ
```

**Security Warning:** Never commit the `.env` file to git! The `PROFILE_WORKER_SECRET` must remain private.

### Step 4: Update the Code to Use the Credentials

Modify `packages/api.regarde.bio/src/index.ts` to use both environment variables:

```typescript
const PROFILE_WORKER_ACCOUNT_ID = process.env.PROFILE_WORKER_ACCOUNT;
const PROFILE_WORKER_SECRET = process.env.PROFILE_WORKER_SECRET;

if (!PROFILE_WORKER_ACCOUNT_ID || !PROFILE_WORKER_SECRET) {
  console.error("PROFILE_WORKER_ACCOUNT and PROFILE_WORKER_SECRET environment variables are required");
  process.exit(1);
}

const workerResult = await startWorker({
  AccountSchema: ProfileWorkerAccount,
  accountID: PROFILE_WORKER_ACCOUNT_ID,
  accountSecret: PROFILE_WORKER_SECRET,
  syncServer: JAZZ_SYNC_SERVER_URL + ...
});
```

## Alternative: Using a Custom Sync Server

If you're using a custom sync server instead of Jazz Cloud, add the `--peer` flag:

```bash
npx jazz-run account create --name "ProfileWorkerAccount" --peer wss://your-sync-server.com
```

## Verification

After setting up the worker account, verify it works:

```bash
cd packages/api.regarde.bio
pnpm dev
```

You should see in the logs:

```
ProfileWorkerAccount started with ID: co_zXXXXXXXXXXXXXXXXXXXXXXXXXX
Note: This worker only loads user profiles - all nickname lookups go through api.regarde.dev API
```

## Production Deployment

For production:

1. **Generate the worker account** in your production environment
2. **Add the account ID** to your production environment variables
3. **Deploy the updated code** with the new ProfileWorkerAccount schema

## Troubleshooting

### "Failed to start Jazz worker"

- Check that `JAZZ_SYNC_SERVER_URL` is set correctly
- Verify network connectivity to the sync server
- Check that `JAZZ_API_KEY` is set if using Jazz Cloud

### "Account not found"

- The worker account ID might be incorrect
- Regenerate the worker account and update the environment variable

### "Permission denied"

- The worker account might not have the correct permissions
- Verify that the ProfileWorkerAccount schema is correctly defined
- Check that user profiles have granted read access to the worker

## Next Steps

After setting up the worker account:

1. Test profile loading by accessing a user profile via api.regarde.bio
2. Verify that nickname lookups work through the api.regarde.dev API
3. Monitor logs for any permission or access issues

