import { Loaded, z } from "jazz-tools";
export declare const SocialLinks: import("jazz-tools").CoMapSchema<{
    github: z.ZodOptional<z.z.ZodString>;
    twitter: z.ZodOptional<z.z.ZodString>;
    website: z.ZodOptional<z.z.ZodString>;
}>;
export type SocialLinks = z.infer<typeof SocialLinks>;
export declare const Project: import("jazz-tools").CoMapSchema<{
    title: z.z.ZodString;
    year: z.z.ZodString;
    client: z.ZodOptional<z.z.ZodString>;
    link: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>;
export type Project = z.infer<typeof Project>;
export declare const ListOfProjects: import("jazz-tools").CoListSchema<import("jazz-tools").CoMapSchema<{
    title: z.z.ZodString;
    year: z.z.ZodString;
    client: z.ZodOptional<z.z.ZodString>;
    link: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>>;
export declare const WorkExp: import("jazz-tools").CoMapSchema<{
    title: z.z.ZodString;
    from: z.z.ZodDate;
    to: z.ZodOptional<z.z.ZodString>;
    company: z.z.ZodString;
    location: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>;
export type WorkExp = z.infer<typeof WorkExp>;
export declare const ListOfWorkExp: import("jazz-tools").CoListSchema<import("jazz-tools").CoMapSchema<{
    title: z.z.ZodString;
    from: z.z.ZodDate;
    to: z.ZodOptional<z.z.ZodString>;
    company: z.z.ZodString;
    location: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>>;
export declare const OnboardingProfile: import("jazz-tools/dist/internal").WithHelpers<import("jazz-tools/dist/internal").CoProfileSchema<{
    name: z.z.ZodString;
    nickname: z.ZodOptional<z.z.ZodString>;
    bio: z.ZodOptional<z.z.ZodString>;
    avatar: z.ZodOptional<z.z.ZodString>;
    socialLinks: z.ZodOptional<import("jazz-tools").CoMapSchema<{
        github: z.ZodOptional<z.z.ZodString>;
        twitter: z.ZodOptional<z.z.ZodString>;
        website: z.ZodOptional<z.z.ZodString>;
    }>>;
    projects: z.ZodOptional<import("jazz-tools").CoListSchema<import("jazz-tools").CoMapSchema<{
        title: z.z.ZodString;
        year: z.z.ZodString;
        client: z.ZodOptional<z.z.ZodString>;
        link: z.ZodOptional<z.z.ZodString>;
        description: z.ZodOptional<z.z.ZodString>;
    }>>>;
    workExp: z.ZodOptional<import("jazz-tools").CoListSchema<import("jazz-tools").CoMapSchema<{
        title: z.z.ZodString;
        from: z.z.ZodDate;
        to: z.ZodOptional<z.z.ZodString>;
        company: z.z.ZodString;
        location: z.ZodOptional<z.z.ZodString>;
        url: z.ZodOptional<z.z.ZodString>;
        description: z.ZodOptional<z.z.ZodString>;
    }>>>;
}>, {
    validate(profile: Loaded<import("jazz-tools/dist/internal").CoProfileSchema<{
        name: z.z.ZodString;
        nickname: z.ZodOptional<z.z.ZodString>;
        bio: z.ZodOptional<z.z.ZodString>;
        avatar: z.ZodOptional<z.z.ZodString>;
        socialLinks: z.ZodOptional<import("jazz-tools").CoMapSchema<{
            github: z.ZodOptional<z.z.ZodString>;
            twitter: z.ZodOptional<z.z.ZodString>;
            website: z.ZodOptional<z.z.ZodString>;
        }>>;
        projects: z.ZodOptional<import("jazz-tools").CoListSchema<import("jazz-tools").CoMapSchema<{
            title: z.z.ZodString;
            year: z.z.ZodString;
            client: z.ZodOptional<z.z.ZodString>;
            link: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        workExp: z.ZodOptional<import("jazz-tools").CoListSchema<import("jazz-tools").CoMapSchema<{
            title: z.z.ZodString;
            from: z.z.ZodDate;
            to: z.ZodOptional<z.z.ZodString>;
            company: z.z.ZodString;
            location: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
    }>>): {
        isValid: boolean;
        message?: string;
    };
}>;
export declare const Container: import("jazz-tools").CoMapSchema<{
    creationMessage: z.ZodOptional<z.z.ZodString>;
}>;
export declare const AccountRoot: import("jazz-tools").CoMapSchema<{
    container: import("jazz-tools").CoMapSchema<{
        creationMessage: z.ZodOptional<z.z.ZodString>;
    }>;
}>;
export declare const OnboardingAccount: import("jazz-tools").AccountSchema<{
    profile: import("jazz-tools/dist/internal").WithHelpers<import("jazz-tools/dist/internal").CoProfileSchema<{
        name: z.z.ZodString;
        nickname: z.ZodOptional<z.z.ZodString>;
        bio: z.ZodOptional<z.z.ZodString>;
        avatar: z.ZodOptional<z.z.ZodString>;
        socialLinks: z.ZodOptional<import("jazz-tools").CoMapSchema<{
            github: z.ZodOptional<z.z.ZodString>;
            twitter: z.ZodOptional<z.z.ZodString>;
            website: z.ZodOptional<z.z.ZodString>;
        }>>;
        projects: z.ZodOptional<import("jazz-tools").CoListSchema<import("jazz-tools").CoMapSchema<{
            title: z.z.ZodString;
            year: z.z.ZodString;
            client: z.ZodOptional<z.z.ZodString>;
            link: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        workExp: z.ZodOptional<import("jazz-tools").CoListSchema<import("jazz-tools").CoMapSchema<{
            title: z.z.ZodString;
            from: z.z.ZodDate;
            to: z.ZodOptional<z.z.ZodString>;
            company: z.z.ZodString;
            location: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
    }>, {
        validate(profile: Loaded<import("jazz-tools/dist/internal").CoProfileSchema<{
            name: z.z.ZodString;
            nickname: z.ZodOptional<z.z.ZodString>;
            bio: z.ZodOptional<z.z.ZodString>;
            avatar: z.ZodOptional<z.z.ZodString>;
            socialLinks: z.ZodOptional<import("jazz-tools").CoMapSchema<{
                github: z.ZodOptional<z.z.ZodString>;
                twitter: z.ZodOptional<z.z.ZodString>;
                website: z.ZodOptional<z.z.ZodString>;
            }>>;
            projects: z.ZodOptional<import("jazz-tools").CoListSchema<import("jazz-tools").CoMapSchema<{
                title: z.z.ZodString;
                year: z.z.ZodString;
                client: z.ZodOptional<z.z.ZodString>;
                link: z.ZodOptional<z.z.ZodString>;
                description: z.ZodOptional<z.z.ZodString>;
            }>>>;
            workExp: z.ZodOptional<import("jazz-tools").CoListSchema<import("jazz-tools").CoMapSchema<{
                title: z.z.ZodString;
                from: z.z.ZodDate;
                to: z.ZodOptional<z.z.ZodString>;
                company: z.z.ZodString;
                location: z.ZodOptional<z.z.ZodString>;
                url: z.ZodOptional<z.z.ZodString>;
                description: z.ZodOptional<z.z.ZodString>;
            }>>>;
        }>>): {
            isValid: boolean;
            message?: string;
        };
    }>;
    root: import("jazz-tools").CoMapSchema<{
        container: import("jazz-tools").CoMapSchema<{
            creationMessage: z.ZodOptional<z.z.ZodString>;
        }>;
    }>;
}>;
