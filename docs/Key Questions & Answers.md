# Key Questions & Answers: `onboarding.jazz` Project Context

This document summarizes key questions and answers regarding the `onboarding.jazz`
project, designed to provide context for an LLM.

**1. How does the Jazz `Account` (with `profile` and `root`) work?**

- **Answer:** In the Jazz framework, the `Account` acts as the central point for all data related to a user.
  - **`Account.root`**: This is for private data specific to a user (e.g., personal settings, private lists). A custom `CoMap` schema is typically defined for `root`.
  - **`Account.profile`**: This is for public data associated with a user (e.g., display name, avatar). The base `Account` comes with a default `profile` field, which can be extended with a custom `Profile` schema (e.g., `OnboardingProfile`). The `Group` managing the `profile` CoMap is typically set up to be readable by "everyone".
  - Data is accessed by resolving references from the `Account`, rather than traditional database joins.
  - A custom `Account` schema (e.g., `OnboardingAccount`) is created, extending `jazz.Account`, to specify custom `root` and `profile` schemas. This custom account must be registered via `declare module "jazz-react"`.
  - The `async migrate()` method in the custom `Account` schema is crucial for initializing `root` and `profile` on account creation and for handling schema evolutions.

**2. Is the idea of an `onboarding.jazz` app for managing public profiles viable and sensible within the Jazz framework?**

- **Answer:** Yes, this idea is viable and aligns well with Jazz's design.
  - `onboarding.jazz` would be an application where users create and manage their public `Account.profile` (using a defined `OnboardingProfile` schema).
  - Jazz's `Account.profile` is inherently designed for publicly readable user information.
  - This allows developers to focus on the UI/UX of profile management, as Jazz handles the underlying data storage, permissions for public data, and real-time synchronization.
  - The profile created in `onboarding.jazz` could then be used across other Jazz applications that are designed to read from the same `Account.profile` schema, promoting a consistent user identity.

**3. What does "Sign in with Jazz" entail?**

- **Answer:** "Sign in with Jazz" refers to the inherent authentication mechanism within the Jazz framework. It's not a separate OAuth-like product.
  - When users access any application built on Jazz, they authenticate using their Jazz account credentials (e.g., email/password).
  - This authentication grants them access to their Jazz `Account` and its associated data within that specific application.
  - The Jazz framework includes concepts like `AuthMethod` for handling user authentication.

**4. How would other developers integrate or use the profile data managed by `onboarding.jazz`?**

- **Answer:** Other Jazz applications (`AppB`) integrate at the **data layer**, not by directly interacting with `onboarding.jazz`'s code.
  1.  **Shared Schema Definitions:** `AppB` must use the _exact same_ `OnboardingAccount` and `OnboardingProfile` schema definitions as `onboarding.jazz`. These schemas would typically be distributed as a shared library/npm package.
  2.  **Register Custom Account:** `AppB` must register the shared `OnboardingAccount` in its own setup (`declare module "jazz-react"`).
  3.  **Access via `useAccount`:** In `AppB`, developers use the `useAccount()` hook. Since `OnboardingAccount` is registered, `me` (the current user object) will be of this type.
  4.  **Read `me.profile`:** `AppB` can then access `me.profile`, which will be the instance of `OnboardingProfile` managed by `onboarding.jazz` (or initialized by the `migrate()` function). `AppB` reads this data to display the user's public profile.
  5.  **Read-Only Convention:** While technically `AppB` could modify the profile data (as it operates with the authenticated user's context), the convention is for `onboarding.jazz` to be the sole editor, and other apps treat the profile as read-only.

**5. How are authentication credentials (like email/password) related to the `Account` versus the `profile`?**

- **Answer:** Authentication credentials are tied to the user's **`Account`**, not directly to the `profile`.
  1.  The email/password (or other auth method) authenticates the user and grants them access to their entire Jazz `Account`.
  2.  The `Account` is the primary entity representing the user.
  3.  The `profile` (e.g., `OnboardingProfile`) is a `CoMap` data structure _referenced by_ and contained within the `Account`.
  4.  When a user signs into any Jazz app (`AppB`), `AppB` gets the authenticated `Account` context. It can then access `me.profile` as a piece of data belonging to that `Account`. `AppB` does not handle the credentials directly; Jazz's auth layer does.

**6. How does username/display name uniqueness and Jazz ID creation work?**

- **Answer:**
  - **Jazz IDs:** Every `CoValue` in Jazz (Accounts, Profile CoMaps, etc.) is automatically assigned a globally unique ID by the Jazz framework upon creation (e.g., `MyProfile.create(...)`). Developers do not manage these IDs.
  - **Authentication Username Uniqueness:** The primary username used for authentication (e.g., the email address used to sign up) is typically enforced as unique by the Jazz authentication system at the account creation stage.
  - **Profile Field Uniqueness (e.g., `displayName`):** Jazz does _not_ automatically enforce uniqueness for values within fields of a `CoMap` like `OnboardingProfile` (e.g., multiple users could set their `displayName` to "LoveJazz"). If uniqueness for such a field is required, the `onboarding.jazz` application would need to implement custom logic to check for and enforce this (e.g., by querying existing profiles before allowing a name to be saved).

**7. What is the user experience (UX) and technical workflow for registration and cross-app profile usage?**

- **Answer:**
  - **Flow 1: User Registration (Creating a Jazz Account for the First Time)**
    - **UX:** User signs up via a form in a Jazz app (e.g., `onboarding.jazz` or `AppA`) using credentials like email/password. Upon success, their Jazz account is created. `onboarding.jazz` might then direct them to edit their new profile.
    - **Workflow:**
      1. User interacts with registration UI.
      2. Jazz auth layer creates a new `Account` CoValue.
      3. The `migrate()` method of the `Account` schema (e.g., `OnboardingAccount.migrate()`) runs automatically, creating the initial `profile` (e.g., `OnboardingProfile`), setting its default data, and ensuring its `Group` permissions allow public read access.
  - **Flow 2: User Signs Into a Different Jazz Application (`AppB`) with Their Existing Profile**
    - **UX:** User, already having a Jazz account (and potentially a profile set via `onboarding.jazz`), signs into `AppB` using their existing Jazz credentials. `AppB`, if designed to, displays their public profile information without requiring re-entry.
    - **Workflow:**
      1. User interacts with `AppB`'s sign-in UI.
      2. Jazz auth layer verifies credentials.
      3. `AppB` receives the authenticated user's `Account` context.
      4. When `AppB` needs profile info, it uses `useAccount()` to access `me.profile`.
      5. Jazz resolves `me.profile` to the `OnboardingProfile` instance associated with that user.
      6. `AppB` reads data from this `OnboardingProfile` to display.
  - **Key Principle:** There's one Jazz account per user. `onboarding.jazz` specializes in editing the `profile` part of that account. Other Jazz apps, when the user signs in with their single Jazz account, can read that same `profile` data.

**8. What is the primary deliverable of the `onboarding.jazz` project itself?**

- **Answer:**
  - The primary deliverable is a functional web application, `onboarding.jazz`.
  - This application will provide the user interface (forms, views, etc.) for end-users to create and modify the data within their `OnboardingProfile`.
  - While a core part of the project is defining the `OnboardingAccount` and `OnboardingProfile` schemas, the project's main output is the application that makes these schemas usable by end-users for profile management.

**9. What is the relationship between `onboarding.jazz` and the core Jazz authentication process?**

- **Answer:**
  - `onboarding.jazz` is a consumer of the Jazz authentication system; it does not implement or replace it.
  - Users will use the standard Jazz sign-up and sign-in mechanisms to access `onboarding.jazz`.
  - Once authenticated by Jazz, `onboarding.jazz` operates within the context of that authenticated user to allow them to manage their `Account.profile`.
  - The application itself doesn't handle password storage, credential verification, or session management – these are responsibilities of the underlying Jazz framework.
