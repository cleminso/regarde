import { co, Group, Loaded, z } from 'jazz-tools';

export const SocialLinks = co.map({
  github: z.optional(z.string()),
  twitter: z.optional(z.string()),
  website: z.optional(z.string()),
});

export type SocialLinks = z.infer<typeof SocialLinks>;

export const Project = co.map({
  title: z.string(),
  year: z.string(),
  client: z.optional(z.string()),
  link: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Project = z.infer<typeof Project>;

export const ListOfProjects = co.list(Project);

export const WorkExp = co.map({
  title: z.string(),
  from: z.date(),
  to: z.optional(z.string()),
  company: z.string(),
  location: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type WorkExp = z.infer<typeof WorkExp>;

export const ListOfWorkExp = co.list(WorkExp);

// TODO:
// export const Attachments = co.map({
// url: z.string(),
// fileName: z.optional(z.string()),
// fileType: z.optional(z.string()),
// fileSize: z.optional(z.number()),
// })
//
// export const ListOfAttachmentItems = co.list(AttachmentItem);
//
// Use it like:  mediaFiles: z.optional(co.list(AttachmentItem)),

export const OnboardingProfile = co
  .profile({
    name: z.string(),
    nickname: z.optional(z.string()),
    bio: z.optional(z.string()),
    avatar: z.optional(z.string()),
    socialLinks: z.optional(SocialLinks),
    projects: z.optional(ListOfProjects),
    workExp: z.optional(ListOfWorkExp),
  })
  .withHelpers((Self) => ({
    validate(profile: Loaded<typeof Self>): {
      isValid: boolean;
      message?: string;
    } {
      if (!profile.name || profile.name.trim() === '') {
        return {
          isValid: false,
          message: 'Name must be present and non-empty.',
        };
      }
      return { isValid: true };
    },
  }));

// The Container co.map should contain the main domain entities of the app. Rule 2.3: Never define a `name` field in the `Container` co.map.

export const Container = co.map({
  creationMessage: z.optional(z.string()),
});

// The AccountRoot is an app-specific per-user private `CoMap` where you can store top-level objects for that user.
// Rule 2.1: The `AccountRoot` co.map must have a `container` property referencing a `Container` schema.
export const AccountRoot = co.map({
  container: Container,
});

export const OnboardingAccount = co
  .account({
    // Rule 1.3 (paraphrased): An account schema should define `profile` and `root`. `profile` points to a `co.profile` schema. `root` points to a `co.map` schema for private per-user data.

    profile: OnboardingProfile,
    root: AccountRoot,
  })
  .withMigration(
    (
      account: Loaded<typeof OnboardingAccount>,
      creationProps?: { name: string },
    ) => {
      // This migration runs on account creation and every login.
      // Rule 1.4 (paraphrased): Account initialization and evolution logic belongs here.

      // Profile migration:
      // Initialize the profile if it's undefined.
      if (account.profile === undefined) {
        // Rule 3.1: If the Profile is intended to be public, set its owner to a `Group` that has `"everyone"` as `"reader"`.
        // Rule 3.2: When creating a group like this, no need to explicitly pass `owner: account`.

        const publicGroup = Group.create();
        publicGroup.addMember('everyone', 'reader');

        account.profile = OnboardingProfile.create(
          {
            // Use name from creationProps if provided, otherwise a default.
            name: creationProps?.name || 'Public Profile',
            // bio, avatar, socialLinks, projects are z.optional and will be undefined initially.
          },
          { owner: publicGroup }, // Profile is owned by the publicGroup
        );
      }

      // Root migration:
      // Initialize the account root if it's undefined.
      if (account.root === undefined) {
        // Rule 2.4: The root structure, when initialized here, is owned by the current `account` by default.

        const containerMessage = creationProps?.name
          ? `Container initialized for ${creationProps.name}.`
          : 'Container initialized.';

        const defaultContainer = Container.create(
          { creationMessage: containerMessage },
          // { owner: account } is implicit for CoValues created by the account for itself
        );

        account.root = AccountRoot.create(
          { container: defaultContainer },
          // { owner: account } is implicit
        );
      }
    },
  );
