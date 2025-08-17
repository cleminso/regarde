
# Jazz.tools Data Access Rules

Based on our analysis of your architecture, here are the practical rules to follow:

## 🎯 Primary Decision Rule

**Use `OnboardingAccount` for CONTEXT, use `JazzAppProfile` for DATA**

---

## 📋 When to Use `OnboardingAccount`

### ✅ Always Use When:

1. **Authentication operations** (login, logout, session management)
2. **Permission verification** (especially in workers)
3. **Account initialization** (migrations, first-time setup)
4. **Cross-account access** (worker accessing user accounts)
5. **You need both auth context AND profile data**

### 🔧 Code Patterns:

```typescript
// ✅ Client authentication
const { me: account } = useAccount(OnboardingAccount);

// ✅ Worker permission verification
const account = await OnboardingAccount.load(accountId, { loadAs: worker });

// ✅ Account management operations
account.profile = ProfileSchema.create(...);
```

---

## 📋 When to Use `JazzAppProfile`

### ✅ Always Use When:

1. **Displaying profile data** (public or private)
2. **Editing profile fields** (when already authenticated)
3. **Public profile access** (no authentication needed)
4. **Performance-critical reads** (when you have the profile ID)
5. **Profile-only operations** (no account context needed)

### 🔧 Code Patterns:

```typescript
// ✅ Direct profile loading (public access)
const profile = await JazzAppProfile.load(profileId);

// ✅ Using pre-resolved profile data
const { jazzAppProfile } = useMyJazz(); // Already resolved from account

// ✅ Profile editing with resolved data
const editProfile = (updates) => {
  jazzAppProfile.name = updates.name;
};
```

---

## ⚡ Performance Rules

### ✅ Efficient Patterns:

1. **Load account once, resolve deep** (like your `useMyJazz`)

```typescript
useAccount(OnboardingAccount, {
  resolve: {
    root: {
      "profile.jazz.dev": {
        /* all fields */
      },
    },
  },
});
```

2. **Use pre-resolved data** instead of additional loads

```typescript
// ✅ Good - use resolved data
const { jazzAppProfile } = useMyJazz();

// ❌ Bad - unnecessary additional load
const profileId = account.profile["profile.jazz.dev"];
const profile = await JazzAppProfile.load(profileId);
```

### ❌ Avoid:

- Multiple loads when one resolve can get everything
- Loading full account when you only need profile data
- Loading profile when you already have it resolved

---

## 🔐 Permission & Security Rules

### ✅ Worker Patterns:

1. **Always use `loadAs: worker`** when accessing user accounts
2. **Use OnboardingAccount for auth verification**
3. **Use JazzAppProfile for serving public data**

```typescript
// ✅ Worker auth check
const account = await OnboardingAccount.load(accountId, { loadAs: worker });

// ✅ Worker public data serving
const profile = await JazzAppProfile.load(profileId); // No special permissions needed
```

### ✅ Client Patterns:

1. **Grant worker permissions during account migration**
2. **Use account context for permission-sensitive operations**

---

## 🏗️ Architecture Patterns

### ✅ Client-Side Hook Pattern:

```typescript
// One hook to rule them all
function useMyJazz() {
  const { me: account } = useAccount(OnboardingAccount, {
    resolve: {
      /* everything you need */
    },
  });

  return {
    account, // For auth context
    jazzAppProfile, // For profile data
    // ... other derived values
  };
}
```

### ✅ Worker API Pattern:

```typescript
// Auth endpoints: Use OnboardingAccount
async function authenticate(accountId) {
  return await OnboardingAccount.load(accountId, { loadAs: worker });
}

// Public endpoints: Use JazzAppProfile
async function getPublicProfile(profileId) {
  return await JazzAppProfile.load(profileId);
}
```

---

## 🚫 Anti-Patterns to Avoid

### ❌ Don't Do:

1. **Loading account for pure data display**

```typescript
// ❌ Overkill for display
const account = await OnboardingAccount.load(id);
const name = account.root["profile.jazz.dev"].name;

// ✅ Better
const profile = await JazzAppProfile.load(profileId);
const name = profile.name;
```

2. **Multiple loads when one resolves all**

```typescript
// ❌ Inefficient
const account = await OnboardingAccount.load(id);
const profileId = account.profile["profile.jazz.dev"];
const profile = await JazzAppProfile.load(profileId);

// ✅ Better
const account = await OnboardingAccount.load(id, {
  resolve: { root: { "profile.jazz.dev": true } },
});
const profile = account.root["profile.jazz.dev"];
```

3. **Using profile data for auth decisions**

```typescript
// ❌ Wrong - profile data isn't auth context
if (jazzAppProfile.userHandle.isActive) {
  /* auth logic */
}

// ✅ Better - use account for auth context
if (account?.profile) {
  /* auth logic */
}
```

---

## 🎯 Quick Decision Tree

```
Need to authenticate or verify permissions?
├─ YES → OnboardingAccount
└─ NO → Already have profile data resolved?
   ├─ YES → Use resolved jazzAppProfile
   └─ NO → Load JazzAppProfile directly

Need account management (login/logout/migration)?
├─ YES → OnboardingAccount
└─ NO → Only profile data?
   └─ YES → JazzAppProfile
```

---

## 📝 Summary Mantras

1. **"Context vs Data"** - Account for context, Profile for data
2. **"Load once, resolve deep"** - Better than multiple loads
3. **"Least privilege"** - Use minimal access level needed
4. **"Pre-resolve in hooks"** - Expose both contexts from central hook
5. **"Workers need loadAs"** - Always specify permission context

These rules should cover 95% of your Jazz.tools data access decisions!
