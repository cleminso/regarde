import { Account, co, Group, Loaded, z } from "jazz-tools";
import { OnboardingNickname } from "./nickname";

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
  from: z.string(),
  to: z.optional(z.string()),
  company: z.string(),
  location: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type WorkExp = z.infer<typeof WorkExp>;

export const ListOfWorkExp = co.list(WorkExp);

export const Writing = co.map({
  title: z.string(),
  year: z.string(),
  publisher: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Writing = z.infer<typeof Writing>;

export const ListOfWriting = co.list(Writing);

export const Education = co.map({
  from: z.string(),
  to: z.optional(z.string()),
  degree: z.string(),
  institution: z.string(),
  location: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Education = z.infer<typeof Education>;

export const ListOfEducation = co.list(Education);

export const Certification = co.map({
  issued: z.string(),
  expire: z.optional(z.string()),
  name: z.string(),
  organization: z.string(),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Certification = z.infer<typeof Certification>;

export const ListOfCertification = co.list(Certification);

export const Speaking = co.map({
  title: z.string(),
  year: z.string(),
  event: z.optional(z.string()),
  location: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Speaking = z.infer<typeof Speaking>;

export const ListOfSpeaking = co.list(Speaking);

export const Award = co.map({
  title: z.string(),
  year: z.string(),
  presenter: z.string(),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Award = z.infer<typeof Award>;

export const ListOfAward = co.list(Award);

export const Volunteering = co.map({
  from: z.string(),
  to: z.optional(z.string()),
  title: z.string(),
  organization: z.string(),
  location: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Volunteering = z.infer<typeof Volunteering>;

export const ListOfVolunteering = co.list(Volunteering);

export const SideProject = co.map({
  title: z.string(),
  year: z.string(),
  client: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type SideProject = z.infer<typeof SideProject>;

export const ListOfSideProject = co.list(SideProject);

export const RegistrationKey = co.map({
  key: z.string(),
  expiresAt: z.number(),
});

export type RegistrationKey = z.infer<typeof RegistrationKey>;

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

export const OnboardingProfile = co.profile({
  name: z.string(),
  onboarding: OnboardingNickname,
  bio: z.optional(z.string()),
  avatar: z.optional(z.string()),
  socialLinks: z.optional(SocialLinks),
  projects: z.optional(ListOfProjects),
  workExp: z.optional(ListOfWorkExp),
  writing: z.optional(ListOfWriting),
  education: z.optional(ListOfEducation),
  certification: z.optional(ListOfCertification),
  speaking: z.optional(ListOfSpeaking),
  award: z.optional(ListOfAward),
  volunteering: z.optional(ListOfVolunteering),
  sideProject: z.optional(ListOfSideProject),
  registrationKey: z.optional(RegistrationKey),
});

OnboardingProfile.withHelpers((Self) => ({
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

    if (!profile.onboarding) {
      return {
        isValid: false,
        message: "Onboarding data is required.",
      };
    }

    if (
      !profile.onboarding.nickname ||
      profile.onboarding.nickname.trim() === ""
    ) {
      return {
        isValid: false,
        message: "Nickname must be non-empty.",
      };
    }

    if (!profile.onboarding.isActive) {
      return {
        isValid: false,
        message: "Nickname must be active.",
      };
    }

    return { isValid: true };
  },
}));

export const Container = co.map({
  creationMessage: z.optional(z.string()),
});

export const AccountRoot = co.map({
  container: Container,
});

export const OnboardingAccount = co
  .account({
    profile: OnboardingProfile,
    root: AccountRoot,
  })
  .withMigration(
    async (
      account: Loaded<typeof OnboardingAccount>,
      creationProps?: { name: string },
    ) => {
      if (
        account.profile === undefined ||
        account.profile?.onboarding === undefined
      ) {
        try {
          // ✅ Create groups with proper owner
          const publicGroup = Group.create({ owner: account });
          publicGroup.addMember("everyone", "reader");

          const nicknameGroup = Group.create({ owner: account });
          nicknameGroup.addMember("everyone", "reader");

          // Add worker permissions
          const workerAccountId = "co_zRgFdJz2k14V4daiih8T4hNEGdR";
          try {
            const workerAccount = await Account.load(workerAccountId);
            if (workerAccount) {
              nicknameGroup.addMember(workerAccount, "writer");
              console.log("Worker permissions added to nickname group");
            } else {
              console.warn("Worker account not available during migration");
            }
          } catch (error) {
            console.warn("Failed to add worker permissions:", error);
            // Continue without worker permissions - can be added later
          }

          // ✅ Create nickname with empty value (not placeholder)
          const onboardingNickname = OnboardingNickname.create(
            {
              nickname: "", // Start empty
              registeredAt: Date.now(),
              lastModified: Date.now(),
              isActive: false,
            },
            { owner: nicknameGroup }, // Explicit owner
          );

          console.log("Onboarding nickname created:", onboardingNickname.id);

          // ✅ Create profile with explicit owner
          account.profile = OnboardingProfile.create(
            {
              name: creationProps?.name || "Public Profile",
              onboarding: onboardingNickname,
            },
            { owner: publicGroup }, // Explicit owner
          );

          console.log("Profile created successfully");
        } catch (error) {
          console.error("Failed to create profile structures:", error);
          throw error;
        }
      }

      // Root creation remains the same...
      if (account.root === undefined) {
        try {
          const containerMessage = creationProps?.name
            ? `Container initialized for ${creationProps.name}.`
            : "Container initialized.";
          const defaultContainer = Container.create({
            creationMessage: containerMessage,
          });
          account.root = AccountRoot.create(
            {
              container: defaultContainer,
            },
            { owner: account },
          );
        } catch (e) {
          console.warn("Container could not be created, likely unlogged", e);
        }
      }
    },
  );
