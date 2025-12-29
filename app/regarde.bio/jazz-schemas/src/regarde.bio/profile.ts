import { co, Group, Loaded, z } from "jazz-tools";
import { RegardeSDK } from "@regarde-dev/sdk/auth";
import { initRegardeSDK } from "@regarde-dev/sdk/init";

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

export const RegardeProfile = co.map({
  name: z.string(),
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

export function validateRegardeProfile(
  profile: Loaded<typeof RegardeProfile>,
): { isValid: boolean; message?: string } {
  if (!profile.name || profile.name.trim() === "") {
    return {
      isValid: false,
      message: "Name must be present and non-empty.",
    };
  }

  // TODO: Move to hook the SDK + move out of profile to `RegardeSDK` co.map
  // if (!profile.userHandle) {
  //   return {
  //     isValid: false,
  //     message: "Onboarding data is required.",
  //   };
  // }

  // if (
  //   !profile.userHandle.nickname ||
  //   profile.userHandle.nickname.trim() === ""
  // ) {
  //   return {
  //     isValid: false,
  //     message: "Nickname must be non-empty.",
  //   };
  // }

  // if (!profile.userHandle.isActive) {
  //   return {
  //     isValid: false,
  //     message: "Nickname must be active.",
  //   };
  // }

  return { isValid: true };
}

// TODO(Clem): Add metadata handling to api.regarde.dev/metadata
export const RegardeProfileMetadata = co.profile({
  "regarde.bio": z.string(), // String ID, requires additional load
});

export const RegardeRoot = co.map({
  "regarde.bio": RegardeProfile,
  "regarde-sdk": RegardeSDK,
});

export const RegardeAccount = co
  .account({
    profile: RegardeProfileMetadata,
    root: RegardeRoot,
  })
  .withMigration(async (account, creationProps?: { name: string }) => {
    const publicGroup = Group.create({
      owner: account,
    });
    publicGroup.makePublic();

    if (!account.$jazz.has("profile")) {
      account.$jazz.set(
        "profile",
        RegardeProfileMetadata.create(
          {
            name: name ?? "no",
            "regarde.bio": "",
          },
          publicGroup,
        ),
      );
    }

    if (!account.$jazz.has("root")) {
      const regardeSdk = await initRegardeSDK(account, "create");

      account.$jazz.set("root", {
        "regarde-sdk": regardeSdk,
        "regarde.bio": {
          name: name ?? "no",
          version: 1,
        },
      });
    }

    await account.$jazz.waitForAllCoValuesSync();

    const { profile, root } = await account.$jazz.ensureLoaded({
      resolve: {
        profile: true,
        root: {
          "regarde-sdk": true,
        },
      },
    });

    if (!root.$isLoaded) {
      console.log("Coucou");
      return;
    }

    console.log("Done for now");

    // First initialization for older accounts
    if (
      (root["regarde.bio"] &&
        root["regarde.bio"].$isLoaded &&
        root["regarde.bio"].version === 0) ||
      root["regarde-sdk"] === undefined ||
      !root["regarde-sdk"].$isLoaded ||
      root["regarde-sdk"].version < 1
    ) {
      const userGroup = Group.create({
        owner: account,
      });

      const regardeProfile = RegardeProfile.create(
        {
          name: creationProps?.name || "Type your name",
          version: 1,
        },
        userGroup,
      );

      const regardeSdk = await initRegardeSDK(account, "create");

      // Safely set on loaded CoMap
      root.$jazz.set("regarde.bio", regardeProfile);
      root.$jazz.set("regarde-sdk", regardeSdk);

      await account.$jazz.waitForSync();

      console.log(
        "regarde.bio namespace profile data created:",
        regardeProfile.$jazz.id,
      );

      profile.$jazz.set("regarde.bio", regardeProfile.$jazz.id);

      console.log("Profile created successfully", regardeProfile.$jazz.id);
      console.log("Account created successfully", account.$jazz.id);
    }
  });
