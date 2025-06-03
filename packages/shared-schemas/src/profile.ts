import { co, Group, Loaded, z } from "jazz-tools";

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
      if (!profile.name || profile.name.trim() === "") {
        return {
          isValid: false,
          message: "Name must be present and non-empty.",
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
      if (account.profile === undefined) {
        try {
          const publicGroup = Group.create({
            owner: account,
          });
          publicGroup.addMember("everyone", "reader");
          account.profile = OnboardingProfile.create(
            {
              name: creationProps?.name || "Public Profile",
            },
            { owner: publicGroup },
          );
        } catch (e) {
          console.warn("Group could not be created, likely unlogged", e);
        }
      }

      if (account.root === undefined) {
        try {
          const containerMessage = creationProps?.name
            ? `Container initialized for ${creationProps.name}.`
            : "Container initialized.";
          const defaultContainer = Container.create({
            creationMessage: containerMessage,
          });
          account.root = AccountRoot.create({ container: defaultContainer });
        } catch (e) {
          console.warn("Container could not be created, likely unlogged", e);
        }
      }
    },
  );
