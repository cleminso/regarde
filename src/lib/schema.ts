import { Account, CoMap, Group, Profile, co } from "jazz-tools";

/** The OnboardingProfile is an app-specific per-user public `CoMap` representing the user's public profile. */
export class OnboardingProfile extends Profile {
  name = co.string;
  bio = co.optional.string;
  avatar = co.optional.string;
  socialLinks = co.optional.ref(SocialLinks);

  static validate(profile: OnboardingProfile): string | undefined {
    if (!profile.name || profile.name.trim() === "") {
      return "Name must be present and non-empty.";
    }
    return undefined;
  }
}

export class SocialLinks extends CoMap {
  github = co.optional.string;
  twitter = co.optional.string;
  linkedin = co.optional.string;
}

/**
 * The Container class (extending `CoMap`) should contain the main domain entities of the app.
 * Rule 2.2.
 * Rule 2.3: Never define a `name` field in the `Container` class.
 */
export class Container extends CoMap {
  // Define main domain entities here if needed in the future.
}

/** The account root is an app-specific per-user private `CoMap`
 *  where you can store top-level objects for that user. */
export class AccountRoot extends CoMap {
  /**
   * Rule 2.1: The `AccountRoot` class (extending `CoMap`) **must** have a `container` property referencing a `Container`.
   */
  container = co.ref(Container);

  // Add private fields here
}

export class OnboardingAccount extends Account {
  profile = co.ref(OnboardingProfile);
  root = co.ref(AccountRoot);

  /** Rule 1.3: Define `export class JazzAccount extends Account` with exactly two properties:
   *  `profile = co.ref(UserProfile);`
   *  `root = co.ref(AccountRoot);`
   */

  /**
   * Rule 1.4: The `JazzAccount` class must have a `migrate(creationProps?: { name: string; other?: Record<string, unknown> })` method.
   * Within `migrate`, if `this._refs.root` is undefined and `creationProps` is provided, run `initialMigration`.
   * The `creationProps` **must** include a `name` property; `other` is optional but do not define more fields.
   */
  private initialMigration(
    this: OnboardingAccount,
    creationProps: { name: string; other?: Record<string, unknown> },
  ) {
    // This method is called when root is undefined AND creationProps are provided.
    // It sets up the AccountRoot and its container.
    // Rule 2.4: Whenever the root structure is initialized, it is always owned by the current `JazzAccount`.
    // Example: this.root = AccountRoot.create({ container: defaultContainer, version: 0 }, { owner: this });
    const defaultContainer = Container.create({}, { owner: this });
    this.root = AccountRoot.create(
      { container: defaultContainer },
      { owner: this },
    );
  }

  /** The account migration is run on account creation and on every log-in.
   *  You can use it to set up the account root and any other initial CoValues you need.
   */
  migrate(
    this: OnboardingAccount,
    creationProps?: { name: string; other?: Record<string, unknown> },
  ) {
    // Profile migration:
    // Initialize the profile if it's undefined.
    if (this.profile === undefined) {
      // Rule 3.1: If the `UserProfile` is intended to be public, set its owner to a `publicGroup`
      // that has `"everyone"` as `"reader"`.
      // Rule 3.2: When creating a group, no need to explicitly pass `owner: this`. That is implicit.
      const publicGroup = Group.create();
      publicGroup.addMember("everyone", "reader");

      this.profile = OnboardingProfile.create(
        {
          // Use name from creationProps if provided, otherwise a default.
          // Rule 1.4 specifies creationProps must include a name if creationProps itself is provided.
          name: creationProps?.name || "Public Profile",
        },
        { owner: publicGroup }, // Profile is owned by the publicGroup
      );
    }

    // Root migration:
    // Rule 1.4: "Within `migrate`, if `this._refs.root` is undefined and `creationProps` is provided, run `initialMigration`."
    if (this._refs.root === undefined && creationProps) {
      this.initialMigration(creationProps);
    }
  }
}
