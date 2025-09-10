import { co, Group, Loaded, z } from "jazz-tools";
import { UserHandle } from "./nickname.js";

export const SocialLinks = co.map({
  github: z.optional(z.string()),
  twitter: z.optional(z.string()),
  website: z.optional(z.string()),
});

export type SocialLinks = z.infer<typeof SocialLinks>;

export const Project = co.map({
  title: z.string(),
  year: z.optional(z.string()),
  client: z.optional(z.string()),
  link: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Project = co.loaded<typeof Project>;

export const ListOfProjects = co.list(Project);

export const WorkExp = co.map({
  title: z.string(),
  from: z.optional(z.string()),
  to: z.optional(z.string()),
  company: z.optional(z.string()),
  location: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type WorkExp = co.loaded<typeof WorkExp>;

export const ListOfWorkExp = co.list(WorkExp);

export const Writing = co.map({
  title: z.string(),
  year: z.optional(z.string()),
  publisher: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Writing = co.loaded<typeof Writing>;

export const ListOfWriting = co.list(Writing);

export const Education = co.map({
  from: z.optional(z.string()),
  to: z.optional(z.string()),
  degree: z.string(),
  institution: z.optional(z.string()),
  location: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Education = co.loaded<typeof Education>;

export const ListOfEducation = co.list(Education);

export const Certification = co.map({
  issued: z.optional(z.string()),
  expire: z.optional(z.string()),
  name: z.string(),
  organization: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Certification = co.loaded<typeof Certification>;

export const ListOfCertification = co.list(Certification);

export const Speaking = co.map({
  title: z.string(),
  year: z.optional(z.string()),
  event: z.optional(z.string()),
  location: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Speaking = co.loaded<typeof Speaking>;

export const ListOfSpeaking = co.list(Speaking);

export const Award = co.map({
  title: z.string(),
  year: z.optional(z.string()),
  presenter: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Award = co.loaded<typeof Award>;

export const ListOfAward = co.list(Award);

export const Volunteering = co.map({
  from: z.optional(z.string()),
  to: z.optional(z.string()),
  title: z.string(),
  organization: z.optional(z.string()),
  location: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Volunteering = co.loaded<typeof Volunteering>;

export const ListOfVolunteering = co.list(Volunteering);

export const SideProject = co.map({
  title: z.string(),
  year: z.optional(z.string()),
  client: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type SideProject = co.loaded<typeof SideProject>;

export const ListOfSideProject = co.list(SideProject);

export const RegistrationKey = co.map({
  key: z.string(),
  expiresAt: z.number(),
});

export type RegistrationKey = z.infer<typeof RegistrationKey>;

export const NowPage = co.map({
  title: z.optional(z.string()),
  location: z.optional(z.string()),
  description: z.string(),
  lastUpdated: z.number(),
});

export type NowPage = z.infer<typeof NowPage>;

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

export const JazzAppProfile = co.map({
  name: z.string(),
  userHandle: UserHandle,
  bio: z.optional(z.string()),
  avatarImage: co.optional(co.image()),
  socialLinks: co.optional(SocialLinks),
  projects: co.optional(ListOfProjects),
  workExp: co.optional(ListOfWorkExp),
  writing: co.optional(ListOfWriting),
  education: co.optional(ListOfEducation),
  certification: co.optional(ListOfCertification),
  speaking: co.optional(ListOfSpeaking),
  award: co.optional(ListOfAward),
  volunteering: co.optional(ListOfVolunteering),
  sideProject: co.optional(ListOfSideProject),
  nowPage: co.optional(NowPage),
  version: z.number(),
});

export function validateJazzAppProfile(
  profile: Loaded<typeof JazzAppProfile>,
): { isValid: boolean; message?: string } {
  if (!profile.name || profile.name.trim() === "") {
    return {
      isValid: false,
      message: "Name must be present and non-empty.",
    };
  }

  if (!profile.userHandle) {
    return {
      isValid: false,
      message: "Onboarding data is required.",
    };
  }

  if (
    !profile.userHandle.nickname ||
    profile.userHandle.nickname.trim() === ""
  ) {
    return {
      isValid: false,
      message: "Nickname must be non-empty.",
    };
  }

  if (!profile.userHandle.isActive) {
    return {
      isValid: false,
      message: "Nickname must be active.",
    };
  }

  return { isValid: true };
}

export const JazzProfileProfile = co.profile({
  "regarde.dev": z.string(), // String ID, requires additional load
  "profile.jazz.dev": z.optional(z.string()),
});

export const JazzProfileRoot = co.map({
  "regarde.dev": JazzAppProfile, // Direct object reference, already loaded
  "auth.regarde.dev": RegistrationKey,
  "profile.jazz.dev": co.optional(JazzAppProfile),
  "auth.jazz.dev": co.optional(RegistrationKey),
});

export const OnboardingAccount = co
  .account({
    profile: JazzProfileProfile,
    root: JazzProfileRoot,
  })
  .withMigration(async (account, creationProps?: { name: string }) => {
    // Load worker group once
    const jazzProfileWorkerGroupID = "co_zoppoxWWJaHYKPgSgUkuCCXQX21";
    const jazzProfileWorkerGroup = await Group.load(jazzProfileWorkerGroupID);
    await jazzProfileWorkerGroup?.ensureLoaded();

    // Handle new account creation
    if (account.root === undefined) {
      const userHandle = UserHandle.create({
        nickname: "",
        registeredAt: Date.now(),
        lastModified: Date.now(),
        isActive: false,
      });

      const jazzProfileData = JazzAppProfile.create({
        name: creationProps?.name || "Type your name",
        userHandle,
        version: 1,
      });

      const registrationKey = RegistrationKey.create({
        key: "not-valid-" + Math.random(),
        expiresAt: 0,
      });

      account.root = JazzProfileRoot.create({
        "regarde.dev": jazzProfileData,
        "auth.regarde.dev": registrationKey,
      });

      // Grant permissions in batch
      if (jazzProfileWorkerGroup) {
        [jazzProfileData, userHandle, registrationKey].forEach((item) => {
          item._owner.castAs(Group).addMember(jazzProfileWorkerGroup, "writer");
        });
      }
    }

    // Handle existing accounts
    const { root } = await account.ensureLoaded({
      resolve: { root: true },
    });

    // Migrate profile.jazz.dev data to regarde.dev
    if (
      root["regarde.dev"] === undefined &&
      root["profile.jazz.dev"] !== undefined
    ) {
      root["regarde.dev"] = root["profile.jazz.dev"];
      console.log("Migrated profile data from profile.jazz.dev to regarde.dev");
    }

    // Migrate auth.jazz.dev data to auth.regarde.dev
    if (
      root["auth.regarde.dev"] === undefined &&
      root["auth.jazz.dev"] !== undefined
    ) {
      root["auth.regarde.dev"] = root["auth.jazz.dev"];
      console.log("Migrated auth data from auth.jazz.dev to auth.regarde.dev");
    }

    // Update profile reference to new namespace
    if (
      account.profile &&
      root["regarde.dev"] &&
      !account.profile["regarde.dev"]
    ) {
      account.profile["regarde.dev"] = root["regarde.dev"].id;
    }

    // Ensure auth.regarde.dev exists
    if (root["auth.regarde.dev"] === undefined) {
      const registrationKey = RegistrationKey.create({
        key: "migrated-" + Math.random(),
        expiresAt: 0,
      });

      root["auth.regarde.dev"] = registrationKey;

      if (jazzProfileWorkerGroup) {
        registrationKey._owner
          .castAs(Group)
          .addMember(jazzProfileWorkerGroup, "writer");
      }
    }

    // Update profile reference if needed
    if (
      account.profile &&
      (!account.profile["regarde.dev"] || account.profile["regarde.dev"] === "")
    ) {
      account.profile["regarde.dev"] = root["regarde.dev"]?.id || "";
      console.log("Updated profile reference to point to regarde.dev profile");
    }

    // Handle profile creation if needed
    if (account.profile === undefined) {
      account.profile = JazzProfileProfile.create({
        name: creationProps?.name || "Anonymous",
        "regarde.dev": root["regarde.dev"]?.id || "",
      });
    }
  });
