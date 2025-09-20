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
});

export const JazzProfileRoot = co.map({
  "regarde.dev": JazzAppProfile, // Direct object reference, already loaded
  "auth.regarde.dev": RegistrationKey,
});

export const OnboardingAccount = co
  .account({
    profile: JazzProfileProfile,
    root: JazzProfileRoot,
  })
  .withMigration(async (account, creationProps?: { name: string }) => {
    const publicGroup = Group.create({
      owner: account,
    });
    publicGroup.makePublic();

    if (!account.$jazz.has("profile")) {
      account.$jazz.set(
        "profile",
        JazzProfileProfile.create(
          {
            name: name ?? "no",
            "regarde.dev": "",
          },
          publicGroup,
        ),
      );
    }

    if (!account.$jazz.has("root")) {
      account.$jazz.set("root", {
        "auth.regarde.dev": RegistrationKey.create(
          {
            key: "no",
            expiresAt: 0,
          },
          Group.create({
            owner: account,
          }),
        ),
        "regarde.dev": {
          name: name ?? "no",
          version: 0,
          userHandle: UserHandle.create(
            {
              nickname: "",
              isActive: false,
              lastModified: Date.now(),
              registeredAt: Date.now(),
            },
            Group.create({
              owner: account,
            }),
          ),
        },
      });
    }

    if (!account.$jazz.has("root")) {
    }

    const { profile, root } = await account.$jazz.ensureLoaded({
      resolve: {
        profile: true,
        root: {
          "auth.regarde.dev": true,
        },
      },
    });

    // First initialization
    if (root["regarde.dev"] && root["regarde.dev"].version === 0) {
      // This is the worker read group, must be hardcoded
      const jazzProfileWorkerGroup = await co
        .group()
        .load("co_zoppoxWWJaHYKPgSgUkuCCXQX21");

      // (:
      if (!jazzProfileWorkerGroup) {
        console.debug("No public group");
        return;
      }

      const userGroup = Group.create({
        owner: account,
      });
      userGroup.addMember(jazzProfileWorkerGroup, "writer");

      const userHandle = UserHandle.create(
        {
          nickname: name ?? "fj",
          registeredAt: Date.now(),
          lastModified: Date.now(),
          isActive: false,
        },
        userGroup,
      );

      const jazzProfileData = JazzAppProfile.create(
        {
          name: creationProps?.name || "Type your name",
          userHandle,
          version: 1,
        },
        userGroup,
      );

      const registrationKey = RegistrationKey.create(
        {
          key: "not-valid-" + Math.random(),
          expiresAt: 0, // key should never be valid, expires as soon as it's generated
        },
        userGroup,
      );

      root.$jazz.set("regarde.dev", jazzProfileData);
      root.$jazz.set("auth.regarde.dev", registrationKey);

      await account.$jazz.waitForSync();

      console.log(
        "regarde.dev namespace profile data created:",
        jazzProfileData.$jazz.id,
      );

      profile.$jazz.set("regarde.dev", jazzProfileData.$jazz.id);

      console.log("Profile created successfully", jazzProfileData.$jazz.id);
      console.log("Account created successfully", account.$jazz.id);
    }
  });
