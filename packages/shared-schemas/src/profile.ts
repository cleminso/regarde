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
  year: z.string(),
  client: z.optional(z.string()),
  link: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Project = co.loaded<typeof Project>;

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

export type WorkExp = co.loaded<typeof WorkExp>;

export const ListOfWorkExp = co.list(WorkExp);

export const Writing = co.map({
  title: z.string(),
  year: z.string(),
  publisher: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Writing = co.loaded<typeof Writing>;

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

export type Education = co.loaded<typeof Education>;

export const ListOfEducation = co.list(Education);

export const Certification = co.map({
  issued: z.string(),
  expire: z.optional(z.string()),
  name: z.string(),
  organization: z.string(),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Certification = co.loaded<typeof Certification>;

export const ListOfCertification = co.list(Certification);

export const Speaking = co.map({
  title: z.string(),
  year: z.string(),
  event: z.optional(z.string()),
  location: z.optional(z.string()),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Speaking = co.loaded<typeof Speaking>;

export const ListOfSpeaking = co.list(Speaking);

export const Award = co.map({
  title: z.string(),
  year: z.string(),
  presenter: z.string(),
  url: z.optional(z.string()),
  description: z.optional(z.string()),
});

export type Award = co.loaded<typeof Award>;

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

export type Volunteering = co.loaded<typeof Volunteering>;

export const ListOfVolunteering = co.list(Volunteering);

export const SideProject = co.map({
  title: z.string(),
  year: z.string(),
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
  avatar: z.optional(z.string()),
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
  registrationKey: co.optional(RegistrationKey),
  nowPage: co.optional(NowPage),
});

export type CleanLoadedJazzAppProfile = Omit<
  Loaded<typeof JazzAppProfile>,
  "registrationKey"
>;

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
  "profile.jazz.dev": z.string(), // String ID, requires additional load
});
export const JazzProfileRoot = co.map({
  "profile.jazz.dev": JazzAppProfile, // Direct object reference, already loaded
});

export const OnboardingAccount = co
  .account({
    profile: JazzProfileProfile,
    root: JazzProfileRoot,
  })
  .withMigration(async (account, creationProps?: { name: string }) => {
    console.log(account.root, account.root?.["profile.jazz.dev"]);

    if (account.root === undefined) {
      try {
        // This is the worker read group, must be hardcoded
        const jazzProfileWorkerGroupID = "co_zoppoxWWJaHYKPgSgUkuCCXQX21";
        const jazzProfileWorkerGroup = await Group.load(
          jazzProfileWorkerGroupID,
        );
        await jazzProfileWorkerGroup?.ensureLoaded();

        const userHandle = UserHandle.create({
          nickname: "",
          registeredAt: Date.now(),
          lastModified: Date.now(),
          isActive: false,
        });

        // Grant Worker ”writer” permission on userHandle
        if (jazzProfileWorkerGroup)
          userHandle._owner
            .castAs(Group)
            .addMember(jazzProfileWorkerGroup, "writer");

        const jazzProfileData = JazzAppProfile.create({
          name: creationProps?.name || "Public Profile",
          userHandle,
        });

        // Grant Worker "write" permission on ProfileData
        if (jazzProfileWorkerGroup)
          jazzProfileData._owner
            .castAs(Group)
            .addMember(jazzProfileWorkerGroup, "writer");

        console.log(
          "profile.jazz.dev namespace profile data created:",
          jazzProfileData.id,
        );

        // Create account profile with ID pointer
        if (account.profile === undefined || account.profile === null)
          account.profile = JazzProfileProfile.create({
            name: "",
            "profile.jazz.dev": jazzProfileData.id,
          });

        // Grant ”everyone” ”reader” permission on account.profile
        account.profile._owner.castAs(Group).addMember("everyone", "reader");

        // Create account.root with actual data object
        if (account.root === undefined || account.root === null)
          account.root = JazzProfileRoot.create({
            "profile.jazz.dev": jazzProfileData,
          });
        

        console.log("Profile created successfully");
      } catch (error) {
        console.error("Failed to create profile structures:", error);
        throw error;
      }
    }
  });
