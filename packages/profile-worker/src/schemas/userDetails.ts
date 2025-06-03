import { z } from "zod";

export const UserDetailsRequestSchema = z.object({
  jazzAccountId: z.string().min(1, "Jazz Account ID is required"),
});

export const UserDetailsResponseSchema = z.object({
  jazzAccountId: z.string(),
  nickname: z.string().optional(),
  exists: z.boolean(),
  nicknameStatus: z.object({
    hasNickname: z.boolean(),
    isRegistered: z.boolean(),
    registrationDate: z.string().optional(),
    canRegisterNickname: z.boolean(),
  }),
  publicData: z.object({
    name: z.string(),
    bio: z.string().optional(),
    avatar: z.string().optional(),
    socialLinks: z.object({
      github: z.string().optional(),
      twitter: z.string().optional(),
      website: z.string().optional(),
    }).optional(),
    projects: z.array(z.object({
      title: z.string(),
      year: z.string(),
      client: z.string().optional(),
      link: z.string().optional(),
      description: z.string().optional(),
    })).optional(),
    workExp: z.array(z.object({
      title: z.string(),
      from: z.string(),
      to: z.string().optional(),
      company: z.string(),
      location: z.string().optional(),
      url: z.string().optional(),
      description: z.string().optional(),
    })).optional(),
  }).optional(),
});

export type UserDetailsRequest = z.infer<typeof UserDetailsRequestSchema>;
export type UserDetailsResponse = z.infer<typeof UserDetailsResponseSchema>;