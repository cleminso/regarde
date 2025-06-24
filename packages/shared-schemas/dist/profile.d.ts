import { Loaded, z } from 'jazz-tools';
export declare const SocialLinks: import('jazz-tools').CoMapSchema<{
    github: z.ZodOptional<z.z.ZodString>;
    twitter: z.ZodOptional<z.z.ZodString>;
    website: z.ZodOptional<z.z.ZodString>;
}>;
export type SocialLinks = z.infer<typeof SocialLinks>;
export declare const Project: import('jazz-tools').CoMapSchema<{
    title: z.z.ZodString;
    year: z.z.ZodString;
    client: z.ZodOptional<z.z.ZodString>;
    link: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>;
export type Project = z.infer<typeof Project>;
export declare const ListOfProjects: import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
    title: z.z.ZodString;
    year: z.z.ZodString;
    client: z.ZodOptional<z.z.ZodString>;
    link: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>>;
export declare const WorkExp: import('jazz-tools').CoMapSchema<{
    title: z.z.ZodString;
    from: z.z.ZodDate;
    to: z.ZodOptional<z.z.ZodString>;
    company: z.z.ZodString;
    location: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>;
export type WorkExp = z.infer<typeof WorkExp>;
export declare const ListOfWorkExp: import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
    title: z.z.ZodString;
    from: z.z.ZodDate;
    to: z.ZodOptional<z.z.ZodString>;
    company: z.z.ZodString;
    location: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>>;
export declare const Writing: import('jazz-tools').CoMapSchema<{
    title: z.z.ZodString;
    year: z.z.ZodString;
    publisher: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>;
export type Writing = z.infer<typeof Writing>;
export declare const ListOfWriting: import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
    title: z.z.ZodString;
    year: z.z.ZodString;
    publisher: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>>;
export declare const Education: import('jazz-tools').CoMapSchema<{
    from: z.z.ZodDate;
    to: z.ZodOptional<z.z.ZodString>;
    degree: z.z.ZodString;
    institution: z.z.ZodString;
    location: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>;
export type Education = z.infer<typeof Education>;
export declare const ListOfEducation: import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
    from: z.z.ZodDate;
    to: z.ZodOptional<z.z.ZodString>;
    degree: z.z.ZodString;
    institution: z.z.ZodString;
    location: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>>;
export declare const Certification: import('jazz-tools').CoMapSchema<{
    issued: z.z.ZodDate;
    expire: z.ZodOptional<z.z.ZodString>;
    name: z.z.ZodString;
    organization: z.z.ZodString;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>;
export type Certification = z.infer<typeof Certification>;
export declare const ListOfCertification: import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
    issued: z.z.ZodDate;
    expire: z.ZodOptional<z.z.ZodString>;
    name: z.z.ZodString;
    organization: z.z.ZodString;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>>;
export declare const Speaking: import('jazz-tools').CoMapSchema<{
    title: z.z.ZodString;
    year: z.z.ZodDate;
    event: z.ZodOptional<z.z.ZodString>;
    location: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>;
export type Speaking = z.infer<typeof Speaking>;
export declare const ListOfSpeaking: import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
    title: z.z.ZodString;
    year: z.z.ZodDate;
    event: z.ZodOptional<z.z.ZodString>;
    location: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>>;
export declare const Award: import('jazz-tools').CoMapSchema<{
    title: z.z.ZodString;
    year: z.z.ZodDate;
    presenter: z.z.ZodString;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>;
export type Award = z.infer<typeof Award>;
export declare const ListOfAward: import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
    title: z.z.ZodString;
    year: z.z.ZodDate;
    presenter: z.z.ZodString;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>>;
export declare const Volunteering: import('jazz-tools').CoMapSchema<{
    from: z.z.ZodDate;
    to: z.ZodOptional<z.z.ZodString>;
    title: z.z.ZodString;
    organization: z.z.ZodString;
    location: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>;
export type Volunteering = z.infer<typeof Volunteering>;
export declare const ListOfVolunteering: import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
    from: z.z.ZodDate;
    to: z.ZodOptional<z.z.ZodString>;
    title: z.z.ZodString;
    organization: z.z.ZodString;
    location: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>>;
export declare const SideProject: import('jazz-tools').CoMapSchema<{
    title: z.z.ZodString;
    year: z.z.ZodString;
    client: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>;
export type SideProject = z.infer<typeof SideProject>;
export declare const ListOfSideProject: import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
    title: z.z.ZodString;
    year: z.z.ZodString;
    client: z.ZodOptional<z.z.ZodString>;
    url: z.ZodOptional<z.z.ZodString>;
    description: z.ZodOptional<z.z.ZodString>;
}>>;
export declare const OnboardingProfile: import('jazz-tools/dist/internal').WithHelpers<import('jazz-tools/dist/internal').CoProfileSchema<{
    name: z.z.ZodString;
    nickname: z.ZodOptional<z.z.ZodString>;
    bio: z.ZodOptional<z.z.ZodString>;
    avatar: z.ZodOptional<z.z.ZodString>;
    socialLinks: z.ZodOptional<import('jazz-tools').CoMapSchema<{
        github: z.ZodOptional<z.z.ZodString>;
        twitter: z.ZodOptional<z.z.ZodString>;
        website: z.ZodOptional<z.z.ZodString>;
    }>>;
    projects: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
        title: z.z.ZodString;
        year: z.z.ZodString;
        client: z.ZodOptional<z.z.ZodString>;
        link: z.ZodOptional<z.z.ZodString>;
        description: z.ZodOptional<z.z.ZodString>;
    }>>>;
    workExp: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
        title: z.z.ZodString;
        from: z.z.ZodDate;
        to: z.ZodOptional<z.z.ZodString>;
        company: z.z.ZodString;
        location: z.ZodOptional<z.z.ZodString>;
        url: z.ZodOptional<z.z.ZodString>;
        description: z.ZodOptional<z.z.ZodString>;
    }>>>;
    writing: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
        title: z.z.ZodString;
        year: z.z.ZodString;
        publisher: z.ZodOptional<z.z.ZodString>;
        url: z.ZodOptional<z.z.ZodString>;
        description: z.ZodOptional<z.z.ZodString>;
    }>>>;
    education: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
        from: z.z.ZodDate;
        to: z.ZodOptional<z.z.ZodString>;
        degree: z.z.ZodString;
        institution: z.z.ZodString;
        location: z.ZodOptional<z.z.ZodString>;
        url: z.ZodOptional<z.z.ZodString>;
        description: z.ZodOptional<z.z.ZodString>;
    }>>>;
    certification: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
        issued: z.z.ZodDate;
        expire: z.ZodOptional<z.z.ZodString>;
        name: z.z.ZodString;
        organization: z.z.ZodString;
        url: z.ZodOptional<z.z.ZodString>;
        description: z.ZodOptional<z.z.ZodString>;
    }>>>;
    speaking: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
        title: z.z.ZodString;
        year: z.z.ZodDate;
        event: z.ZodOptional<z.z.ZodString>;
        location: z.ZodOptional<z.z.ZodString>;
        url: z.ZodOptional<z.z.ZodString>;
        description: z.ZodOptional<z.z.ZodString>;
    }>>>;
    award: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
        title: z.z.ZodString;
        year: z.z.ZodDate;
        presenter: z.z.ZodString;
        url: z.ZodOptional<z.z.ZodString>;
        description: z.ZodOptional<z.z.ZodString>;
    }>>>;
    volunteering: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
        from: z.z.ZodDate;
        to: z.ZodOptional<z.z.ZodString>;
        title: z.z.ZodString;
        organization: z.z.ZodString;
        location: z.ZodOptional<z.z.ZodString>;
        url: z.ZodOptional<z.z.ZodString>;
        description: z.ZodOptional<z.z.ZodString>;
    }>>>;
    sideProject: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
        title: z.z.ZodString;
        year: z.z.ZodString;
        client: z.ZodOptional<z.z.ZodString>;
        url: z.ZodOptional<z.z.ZodString>;
        description: z.ZodOptional<z.z.ZodString>;
    }>>>;
}>, {
    validate(profile: Loaded<import('jazz-tools/dist/internal').CoProfileSchema<{
        name: z.z.ZodString;
        nickname: z.ZodOptional<z.z.ZodString>;
        bio: z.ZodOptional<z.z.ZodString>;
        avatar: z.ZodOptional<z.z.ZodString>;
        socialLinks: z.ZodOptional<import('jazz-tools').CoMapSchema<{
            github: z.ZodOptional<z.z.ZodString>;
            twitter: z.ZodOptional<z.z.ZodString>;
            website: z.ZodOptional<z.z.ZodString>;
        }>>;
        projects: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            title: z.z.ZodString;
            year: z.z.ZodString;
            client: z.ZodOptional<z.z.ZodString>;
            link: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        workExp: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            title: z.z.ZodString;
            from: z.z.ZodDate;
            to: z.ZodOptional<z.z.ZodString>;
            company: z.z.ZodString;
            location: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        writing: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            title: z.z.ZodString;
            year: z.z.ZodString;
            publisher: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        education: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            from: z.z.ZodDate;
            to: z.ZodOptional<z.z.ZodString>;
            degree: z.z.ZodString;
            institution: z.z.ZodString;
            location: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        certification: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            issued: z.z.ZodDate;
            expire: z.ZodOptional<z.z.ZodString>;
            name: z.z.ZodString;
            organization: z.z.ZodString;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        speaking: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            title: z.z.ZodString;
            year: z.z.ZodDate;
            event: z.ZodOptional<z.z.ZodString>;
            location: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        award: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            title: z.z.ZodString;
            year: z.z.ZodDate;
            presenter: z.z.ZodString;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        volunteering: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            from: z.z.ZodDate;
            to: z.ZodOptional<z.z.ZodString>;
            title: z.z.ZodString;
            organization: z.z.ZodString;
            location: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        sideProject: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            title: z.z.ZodString;
            year: z.z.ZodString;
            client: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
    }>>): {
        isValid: boolean;
        message?: string;
    };
}>;
export declare const Container: import('jazz-tools').CoMapSchema<{
    creationMessage: z.ZodOptional<z.z.ZodString>;
}>;
export declare const AccountRoot: import('jazz-tools').CoMapSchema<{
    container: import('jazz-tools').CoMapSchema<{
        creationMessage: z.ZodOptional<z.z.ZodString>;
    }>;
}>;
export declare const OnboardingAccount: import('jazz-tools').AccountSchema<{
    profile: import('jazz-tools/dist/internal').WithHelpers<import('jazz-tools/dist/internal').CoProfileSchema<{
        name: z.z.ZodString;
        nickname: z.ZodOptional<z.z.ZodString>;
        bio: z.ZodOptional<z.z.ZodString>;
        avatar: z.ZodOptional<z.z.ZodString>;
        socialLinks: z.ZodOptional<import('jazz-tools').CoMapSchema<{
            github: z.ZodOptional<z.z.ZodString>;
            twitter: z.ZodOptional<z.z.ZodString>;
            website: z.ZodOptional<z.z.ZodString>;
        }>>;
        projects: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            title: z.z.ZodString;
            year: z.z.ZodString;
            client: z.ZodOptional<z.z.ZodString>;
            link: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        workExp: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            title: z.z.ZodString;
            from: z.z.ZodDate;
            to: z.ZodOptional<z.z.ZodString>;
            company: z.z.ZodString;
            location: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        writing: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            title: z.z.ZodString;
            year: z.z.ZodString;
            publisher: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        education: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            from: z.z.ZodDate;
            to: z.ZodOptional<z.z.ZodString>;
            degree: z.z.ZodString;
            institution: z.z.ZodString;
            location: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        certification: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            issued: z.z.ZodDate;
            expire: z.ZodOptional<z.z.ZodString>;
            name: z.z.ZodString;
            organization: z.z.ZodString;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        speaking: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            title: z.z.ZodString;
            year: z.z.ZodDate;
            event: z.ZodOptional<z.z.ZodString>;
            location: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        award: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            title: z.z.ZodString;
            year: z.z.ZodDate;
            presenter: z.z.ZodString;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        volunteering: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            from: z.z.ZodDate;
            to: z.ZodOptional<z.z.ZodString>;
            title: z.z.ZodString;
            organization: z.z.ZodString;
            location: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
        sideProject: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
            title: z.z.ZodString;
            year: z.z.ZodString;
            client: z.ZodOptional<z.z.ZodString>;
            url: z.ZodOptional<z.z.ZodString>;
            description: z.ZodOptional<z.z.ZodString>;
        }>>>;
    }>, {
        validate(profile: Loaded<import('jazz-tools/dist/internal').CoProfileSchema<{
            name: z.z.ZodString;
            nickname: z.ZodOptional<z.z.ZodString>;
            bio: z.ZodOptional<z.z.ZodString>;
            avatar: z.ZodOptional<z.z.ZodString>;
            socialLinks: z.ZodOptional<import('jazz-tools').CoMapSchema<{
                github: z.ZodOptional<z.z.ZodString>;
                twitter: z.ZodOptional<z.z.ZodString>;
                website: z.ZodOptional<z.z.ZodString>;
            }>>;
            projects: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
                title: z.z.ZodString;
                year: z.z.ZodString;
                client: z.ZodOptional<z.z.ZodString>;
                link: z.ZodOptional<z.z.ZodString>;
                description: z.ZodOptional<z.z.ZodString>;
            }>>>;
            workExp: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
                title: z.z.ZodString;
                from: z.z.ZodDate;
                to: z.ZodOptional<z.z.ZodString>;
                company: z.z.ZodString;
                location: z.ZodOptional<z.z.ZodString>;
                url: z.ZodOptional<z.z.ZodString>;
                description: z.ZodOptional<z.z.ZodString>;
            }>>>;
            writing: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
                title: z.z.ZodString;
                year: z.z.ZodString;
                publisher: z.ZodOptional<z.z.ZodString>;
                url: z.ZodOptional<z.z.ZodString>;
                description: z.ZodOptional<z.z.ZodString>;
            }>>>;
            education: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
                from: z.z.ZodDate;
                to: z.ZodOptional<z.z.ZodString>;
                degree: z.z.ZodString;
                institution: z.z.ZodString;
                location: z.ZodOptional<z.z.ZodString>;
                url: z.ZodOptional<z.z.ZodString>;
                description: z.ZodOptional<z.z.ZodString>;
            }>>>;
            certification: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
                issued: z.z.ZodDate;
                expire: z.ZodOptional<z.z.ZodString>;
                name: z.z.ZodString;
                organization: z.z.ZodString;
                url: z.ZodOptional<z.z.ZodString>;
                description: z.ZodOptional<z.z.ZodString>;
            }>>>;
            speaking: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
                title: z.z.ZodString;
                year: z.z.ZodDate;
                event: z.ZodOptional<z.z.ZodString>;
                location: z.ZodOptional<z.z.ZodString>;
                url: z.ZodOptional<z.z.ZodString>;
                description: z.ZodOptional<z.z.ZodString>;
            }>>>;
            award: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
                title: z.z.ZodString;
                year: z.z.ZodDate;
                presenter: z.z.ZodString;
                url: z.ZodOptional<z.z.ZodString>;
                description: z.ZodOptional<z.z.ZodString>;
            }>>>;
            volunteering: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
                from: z.z.ZodDate;
                to: z.ZodOptional<z.z.ZodString>;
                title: z.z.ZodString;
                organization: z.z.ZodString;
                location: z.ZodOptional<z.z.ZodString>;
                url: z.ZodOptional<z.z.ZodString>;
                description: z.ZodOptional<z.z.ZodString>;
            }>>>;
            sideProject: z.ZodOptional<import('jazz-tools').CoListSchema<import('jazz-tools').CoMapSchema<{
                title: z.z.ZodString;
                year: z.z.ZodString;
                client: z.ZodOptional<z.z.ZodString>;
                url: z.ZodOptional<z.z.ZodString>;
                description: z.ZodOptional<z.z.ZodString>;
            }>>>;
        }>>): {
            isValid: boolean;
            message?: string;
        };
    }>;
    root: import('jazz-tools').CoMapSchema<{
        container: import('jazz-tools').CoMapSchema<{
            creationMessage: z.ZodOptional<z.z.ZodString>;
        }>;
    }>;
}>;
