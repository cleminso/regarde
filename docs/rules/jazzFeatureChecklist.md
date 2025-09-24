# Jazz.tools Feature Implementation Checklist

Use this checklist when implementing any new feature to ensure you follow Jazz best practices and leverage existing patterns effectively.

---

## 1. 📋 Schema Design Questions

### 🔍 Data Structure Analysis

- [ ] **What type of data am I storing?**
  - User-specific data → Extend `JazzAppProfile` or create new CoMap linked to it
  - System-wide data → Create worker-managed CoRecord (like `NicknameRegistry`)
  - Relational data → Use CoList or CoMap with references

- [ ] **Does this extend existing data or require new structures?**

  ```typescript
  // ✅ Extending existing (add to shared-schemas/src/profile.ts)
  export const JazzAppProfile = co.map({
    // ... existing fields
    newFeature: co.optional(NewFeatureSchema),
  });

  // ✅ New independent structure
  export const NewFeatureData = co.map({
    // ... new fields
  });
  ```

- [ ] **How does this relate to existing schemas?**
  - Reference existing data → Use `co.ref()` or direct inclusion
  - Independent data → Create new schema in shared-schemas
  - Worker-managed → Add to `RegistryWorkerAccountRoot`

### 🔗 Relationship Patterns

- [ ] **Do I need references to other CoValues?**

  ```typescript
  // ✅ Reference pattern (like UserHandle in JazzAppProfile)
  userHandle: UserHandle,

  // ✅ List of references
  items: co.list(ItemSchema),

  // ✅ Optional reference
  relatedData: co.optional(OtherSchema),
  ```

- [ ] **Should this be in shared-schemas?**
  - Used by both client AND worker → Yes, add to shared-schemas
  - Client-only → Consider keeping in profile-app
  - Worker-only → Keep in profile-worker, but consider shared-schemas for type safety

---

## 2. 🔐 Account vs Profile Access Questions

### 🎯 Context Requirements

- [ ] **Do I need authentication context?**
  - YES → Use `OnboardingAccount`
  - NO → Use `JazzAppProfile` or resolved data

- [ ] **Am I verifying permissions or ownership?**
  - YES → Use `OnboardingAccount` (especially in worker)
  - NO → Direct profile access is fine

- [ ] **Is this user management or data display?**

  ```typescript
  // ✅ User management (auth context needed)
  const { account, logOut } = useMyJazz();

  // ✅ Data display (resolved data sufficient)
  const { jazzAppProfile } = useMyJazz();
  ```

### ⚡ Performance Considerations

- [ ] **Can I use pre-resolved data from `useMyJazz`?**
  - Already resolved → Use `jazzAppProfile` from hook
  - Need different resolution → Load directly
  - Need account context → Use `account` from hook

- [ ] **Do I need to add new resolve queries to `useMyJazz`?**
  ```typescript
  // Add to useMyJazz.ts resolve block
  resolve: {
    root: {
      'regarde.bio': {
        // ... existing fields
        newFeature: true, // ← Add here
      }
    }
  }
  ```

---

## 3. 🏗️ Client vs Worker Responsibility Questions

### 🤔 Logic Placement Decision

- [ ] **Does this require centralized coordination?**
  - Uniqueness constraints (like nicknames) → Worker
  - Cross-user data management → Worker
  - Personal data management → Client

- [ ] **Does this need to work offline?**
  - YES → Client-side with Jazz sync
  - NO → Can be worker-dependent

- [ ] **Does this require system-level permissions?**
  - YES → Worker (like accessing all user accounts)
  - NO → Client is fine

### 🔄 Communication Patterns

- [ ] **How will client communicate with worker?**

  ```typescript
  // ✅ HTTP API pattern (like nickname registration)
  export async function newFeatureAction(
    request: NewFeatureRequest,
    getValidKey: () => Promise<string | null>,
  ): Promise<void> {
    const registrationKey = await getValidKey();
    const response = await fetch(`${API_BASE_URL}/new-feature`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Registration-Key": registrationKey,
      },
      body: JSON.stringify(request),
    });
  }
  ```

- [ ] **Do I need real-time updates?**
  - YES → Jazz sync handles this automatically
  - Immediate feedback needed → HTTP response + Jazz sync

---

## 4. 🔒 Permission and Security Questions

### 👥 Access Control Design

- [ ] **Who should have access to this data?**
  - User only → User's owner group
  - Public reading → Grant "everyone" reader access
  - Worker access → Grant worker group writer access
  - Shared data → Use custom groups

- [ ] **Should worker have write access?**

  ```typescript
  // ✅ Grant worker access pattern (like in profile.ts migration)
  const jazzProfileWorkerGroupID = "co_zoppoxWWJaHYKPgSgUkuCCXQX21";
  const jazzProfileWorkerGroup = await Group.load(jazzProfileWorkerGroupID);

  if (jazzProfileWorkerGroup) {
    newData._owner.castAs(Group).addMember(jazzProfileWorkerGroup, "writer");
  }
  ```

- [ ] **Is this public or private data?**
  - Public → Grant "everyone" reader access
  - Private → Keep default owner permissions
  - Semi-public → Custom group management

### 🔑 Authentication Requirements

- [ ] **Do worker operations need authentication?**
  - User-specific actions → Use registration key pattern
  - Public operations → No auth needed
  - Admin operations → Additional verification

---

## 5. 🌊 Data Flow Questions

### 📡 Sync and Loading Strategy

- [ ] **What resolve queries do I need?**

  ```typescript
  // ✅ Add to existing patterns
  const data = await JazzAppProfile.load(profileId, {
    resolve: {
      existingField: true,
      newFeature: {
        subField: true,
        list: { $each: true },
      },
    },
  });
  ```

- [ ] **How deep should I resolve data?**
  - Display lists → `{ $each: true }`
  - Referenced objects → `true` or specific fields
  - Performance critical → Minimal resolution

- [ ] **Do I need subscription hooks?**
  ```typescript
  // ✅ Follow existing patterns
  function useNewFeature() {
    const { jazzAppProfile } = useMyJazz();
    return {
      newFeatureData: jazzAppProfile?.newFeature,
      // ... other derived state
    };
  }
  ```

### 🔄 Update Propagation

- [ ] **How do changes flow through the system?**
  - Client updates → Jazz sync → Other clients (automatic)
  - Worker updates → Jazz sync → Clients (automatic)
  - HTTP responses → Immediate feedback, Jazz sync for persistence

- [ ] **Do I need loading states?**
  - Async operations → Yes, follow existing patterns
  - Real-time updates → Jazz handles automatically

---

## 6. 🔌 Integration Questions

### 🎣 Hook Integration

- [ ] **Should I extend `useMyJazz` or create new hooks?**

  ```typescript
  // ✅ Extend useMyJazz for core user data
  export function useMyJazz() {
    // ... existing code
    return {
      // ... existing returns
      newFeatureData: account?.root["regarde.bio"]?.newFeature,
    };
  }

  // ✅ Create dedicated hook for complex features
  export function useNewFeature() {
    const { jazzAppProfile } = useMyJazz();
    // ... feature-specific logic
  }
  ```

- [ ] **Do I need new API endpoints in the worker?**
  - Follow existing patterns in `packages/profile-worker/src/routes/`
  - Use OpenAPI schema definitions
  - Include proper error handling

### 📦 Package Organization

- [ ] **Where should code live?**
  - Schemas → `packages/shared-schemas/src/`
  - Client logic → `packages/profile-app/src/lib/`
  - Worker logic → `packages/profile-worker/src/`
  - API types → Both client and worker, or shared-schemas

- [ ] **Do I need new shared utilities?**
  ```typescript
  // ✅ Add to shared-schemas if used by both client and worker
  export function validateNewFeature(data: any): boolean {
    // ... validation logic
  }
  ```

---

## 🎯 Quick Decision Matrix

| **If your feature is...**  | **Then use...**                                 |
| -------------------------- | ----------------------------------------------- |
| Personal user data         | Client-side with JazzAppProfile extension       |
| System-wide coordination   | Worker with shared registry pattern             |
| Public profile enhancement | Extend JazzAppProfile, grant public read access |
| Real-time collaboration    | Client-side with Jazz sync                      |
| Uniqueness enforcement     | Worker with global state management             |
| User preference/setting    | Client-side with local storage backup           |

---

## ✅ Final Validation Questions

Before implementing, ask:

- [ ] Does this follow existing patterns in our codebase?
- [ ] Can I reuse existing hooks, schemas, or API patterns?
- [ ] Is the permission model consistent with our current approach?
- [ ] Will this scale with our current Jazz sync architecture?
- [ ] Have I considered both online and offline scenarios?
- [ ] Does this maintain type safety across client/worker boundaries?

**Remember**: When in doubt, follow the patterns already established in your `useMyJazz`, `JazzAppProfile`, and worker route handlers!
