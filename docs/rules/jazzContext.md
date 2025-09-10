# Jazz.tools Development Context

Quick reference for LLM assistance with the onboarding.jazz project.

## 📁 Project Structure

```
packages/
├── shared-schemas/          # Single source of truth for all schemas
│   ├── src/profile.ts      # OnboardingAccount, JazzAppProfile schemas
│   └── src/registry.ts     # RegistryWorkerAccount schema
├── profile-app/            # React client application
│   └── src/lib/account/useMyJazz.ts  # Central data access hook
└── profile-worker/         # Server worker with Jazz account
    └── src/routes/         # API endpoints and worker logic
```

## 🔑 Key Schemas

### OnboardingAccount

- **Purpose**: User authentication + account management
- **Contains**: `profile` (public ID ref) + `root` (private resolved data)
- **Use for**: Authentication, permissions, account operations

### JazzAppProfile

- **Purpose**: User profile data structure
- **Contains**: `name`, `userHandle`, `projects`, `workExp`, `socialLinks`
- **Use for**: Profile display, editing, public access

### RegistryWorkerAccount

- **Purpose**: Worker's own Jazz account for system operations
- **Contains**: Nickname registry, audit logs, system data

## 🎯 Core Decision Rule

**Use `OnboardingAccount` for CONTEXT, use `JazzAppProfile` for DATA**

## 📋 Common Imports

### Client Side

```typescript
import { useAccount } from "jazz-tools/react";
import {
  OnboardingAccount,
  JazzAppProfile,
} from "@onboarding.jazz/shared-schemas";
```

### Worker Side

```typescript
import { OnboardingAccount, JazzAppProfile } from "../shared-schemas";
```

## 🔧 Key Patterns

### Client: Central Hook Pattern

```typescript
const { account, jazzAppProfile, isAuthenticated } = useMyJazz();
if (!account) return <Loading />;
// Use jazzAppProfile for all profile data access
```

### Worker: Permission Context

```typescript
const account = await OnboardingAccount.load(accountId, {
  loadAs: worker,
  resolve: { root: { "regarde.dev": true } },
});
```

### Public Profile Access

```typescript
const profile = await JazzAppProfile.load(profileId, {
  resolve: { socialLinks: true, projects: { $each: true } },
});
```

## 🚨 Anti-Patterns to Avoid

- ❌ Loading account for pure display: `OnboardingAccount.load()` → `JazzAppProfile.load()`
- ❌ Multiple loads when resolved: `useMyJazz()` already provides `jazzAppProfile`
- ❌ Worker without `loadAs`: Always use `{ loadAs: worker }`
- ❌ Using profile data for auth: Use `account` context for authentication logic

## 📝 Quick Decision Tree

```
Need authentication/permissions? → OnboardingAccount
Need profile data only? → JazzAppProfile (or use resolved jazzAppProfile)
Building worker endpoint? → OnboardingAccount with loadAs: worker
Building public view? → JazzAppProfile.load()
```

## 🎯 Architecture Principles

1. **"Context vs Data"** - Account for context, Profile for data
2. **"Load once, resolve deep"** - Better than multiple loads
3. **"Pre-resolve in hooks"** - Expose resolved data from central hook
4. **"Workers need loadAs"** - Always specify permission context
5. **"Least privilege"** - Use minimal access level needed
