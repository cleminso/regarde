`<JazzProvider />` is the core component that connects your React application to Jazz. It handles:

- **Data Synchronization**: Manages connections to peers and the Jazz cloud
- **Local Storage**: Persists data locally between app sessions
- **Schema Types**: Provides APIs for the [AccountSchema](https://jazz.tools/docs/react/schemas/accounts-and-migrations)
- **Authentication**: Connects your authentication system to Jazz

Our [Chat example app](https://jazz.tools/examples#chat) provides a complete implementation of JazzProvider with authentication and real-time data sync.

## [](https://jazz.tools/docs/react/project-setup/providers#setting-up-the-provider)Setting up the Provider

The `<JazzProvider />` accepts several configuration options:

```
// App.tsx
import { JazzProvider } from "jazz-react";
import { MyAppAccount } from "./schema";

export function MyApp({ children }: { children: React.ReactNode }) {
  return (
    <JazzProvider
      sync={{
        peer: "wss://cloud.jazz.tools/?key=your-api-key",
        when: "always" // When to sync: "always", "never", or "signedUp"
      }}
      AccountSchema={MyAppAccount}
    >
      {children}
    </JazzProvider>
  );
}

// Register the Account schema so `useAccount` returns our custom `MyAppAccount`
declare module "jazz-react" {
  interface Register {
    Account: MyAppAccount;
  }
}
```

## [](https://jazz.tools/docs/react/project-setup/providers#provider-options)Provider Options

### [](https://jazz.tools/docs/react/project-setup/providers#sync-options)Sync Options

The `sync` property configures how your application connects to the Jazz network:

```
import { type SyncConfig } from "jazz-tools";

const syncConfig: SyncConfig = {
  // Connection to Jazz Cloud or your own sync server
  peer: "wss://cloud.jazz.tools/?key=your-api-key",

  // When to sync: "always" (default), "never", or "signedUp"
  when: "always",
}
```

See [Authentication States](https://jazz.tools/docs/react/authentication/authentication-states#controlling-sync-for-different-authentication-states) for more details on how the `when` property affects synchronization based on authentication state.

### [](https://jazz.tools/docs/react/project-setup/providers#account-schema)Account Schema

The `AccountSchema` property defines your application's account structure:

```
// app.tsx
import { MyAppAccount } from "./schema";

export function MyApp ({ children }: { children: React.ReactNode }) {
  // Use in provider
  return (
    <JazzProvider
      sync={syncConfig}

      AccountSchema={MyAppAccount}
    >
      {children}
    </JazzProvider>
  );
}

// Register type for useAccount
declare module "jazz-react" {
  interface Register {
    Account: MyAppAccount;
  }
}
```

### [](https://jazz.tools/docs/react/project-setup/providers#additional-options)Additional Options

The provider accepts these additional options:

```
// app.tsx
export function MyApp ({ children }: { children: React.ReactNode }) {
  return (
    <JazzProvider
      sync={syncConfig}

      // Enable guest mode for account-less access
      guestMode={false}

      // Set default name for new user profiles
      defaultProfileName="New User"

      // Handle user logout
      onLogOut={() => {
        console.log("User logged out");
      }}

      // Handle anonymous account data when user logs in to existing account
      onAnonymousAccountDiscarded={(account) => {
        console.log("Anonymous account discarded", account.id);
        // Migrate data here
        return Promise.resolve();
      }}
    >
      {children}
    </JazzProvider>
  );
}
```

See [Authentication States](https://jazz.tools/docs/react/authentication/authentication-states) for more information on authentication states, guest mode, and handling anonymous accounts.

## [](https://jazz.tools/docs/react/project-setup/providers#authentication)Authentication

`<JazzProvider />` works with various authentication methods to enable users to access their data across multiple devices. For a complete guide to authentication, see our [Authentication Overview](https://jazz.tools/docs/react/authentication/overview).

## [](https://jazz.tools/docs/react/project-setup/providers#need-help)Need Help?

If you have questions about configuring the Jazz Provider for your specific use case, [join our Discord community](https://discord.gg/utDMjHYg42) for help.
