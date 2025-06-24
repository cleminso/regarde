import { z } from "zod";

export const UserDetailsRequestSchema = z
  .object({
    jazzAccountId: z
      .string()
      .min(1)
      .optional()
      .describe(
        "The Jazz Account ID to look up. Format: co_[base58 string]. Example: co_zdpuB2Ww8jKvjq7Kp9M4N5o6P7q8R9s0T",
      ),
    nickname: z
      .string()
      .min(1)
      .optional()
      .describe(
        "The registered nickname to resolve to an account. Must be an existing nickname in the registry. Example: john_doe",
      ),
  })
  .refine((data) => data.jazzAccountId || data.nickname, {
    message: "Either jazzAccountId or nickname is required",
  })
  .describe(
    "Query parameters for user lookup. Provide either jazzAccountId, nickname, or both for validation.",
  );

export const UserDetailsResponseSchema = z
  .object({
    jazzAccountId: z
      .string()
      .describe("The resolved Jazz Account ID for this user"),
    nickname: z
      .string()
      .optional()
      .describe("The current registered nickname for this account, if any"),
    requestedNickname: z
      .string()
      .optional()
      .describe(
        "The nickname that was used in the request (for transparency when nickname was provided)",
      ),
    exists: z
      .boolean()
      .describe(
        "Whether the user account exists and has profile data available",
      ),
    nicknameStatus: z
      .object({
        hasNickname: z
          .boolean()
          .describe("Whether this account has a registered nickname"),
        isRegistered: z
          .boolean()
          .describe(
            "Whether this account is registered in the nickname system (same as hasNickname)",
          ),
        registrationDate: z
          .string()
          .optional()
          .describe("When the nickname was registered (not currently tracked)"),
        canRegisterNickname: z
          .boolean()
          .describe(
            "Whether this account can register a new nickname (inverse of hasNickname)",
          ),
      })
      .describe(
        "Detailed information about the nickname registration status for this account",
      ),
    publicData: z
      .object({
        name: z.string().describe("The user's display name"),
        bio: z.string().optional().describe("User's biography or description"),
        avatar: z
          .string()
          .optional()
          .describe("URL or identifier for the user's profile picture"),
        socialLinks: z
          .object({
            github: z
              .string()
              .optional()
              .describe("GitHub username or profile URL"),
            twitter: z
              .string()
              .optional()
              .describe("Twitter/X handle or profile URL"),
            website: z.string().optional().describe("Personal website URL"),
          })
          .optional()
          .describe("Collection of social media and web presence links"),
        projects: z
          .array(
            z.object({
              title: z.string().describe("Project name or title"),
              year: z
                .string()
                .describe("Year the project was completed or started"),
              client: z
                .string()
                .optional()
                .describe("Client or organization the project was for"),
              link: z
                .string()
                .optional()
                .describe("URL to view the project (portfolio, demo, etc.)"),
              description: z
                .string()
                .optional()
                .describe("Detailed description of the project"),
            }),
          )
          .optional()
          .describe("Array of user's portfolio projects"),
        workExp: z
          .array(
            z.object({
              title: z.string().describe("Job title or position name"),
              from: z
                .string()
                .describe("Start date of employment (flexible format)"),
              to: z
                .string()
                .optional()
                .describe(
                  "End date of employment (optional for current positions)",
                ),
              company: z.string().describe("Company or organization name"),
              location: z
                .string()
                .optional()
                .describe("Work location (city, remote, etc.)"),
              url: z
                .string()
                .optional()
                .describe("Company website or LinkedIn profile URL"),
              description: z
                .string()
                .optional()
                .describe("Description of role and responsibilities"),
            }),
          )
          .optional()
          .describe("Array of work experience entries"),
        writing: z
          .array(
            z.object({
              title: z
                .string()
                .describe("Title of the written work or article"),
              year: z
                .string()
                .describe("Year the work was published or written"),
              publisher: z
                .string()
                .optional()
                .describe(
                  "Publisher, publication, or platform where it was published",
                ),
              url: z
                .string()
                .optional()
                .describe("URL to view or read the writing piece"),
              description: z
                .string()
                .optional()
                .describe("Description or summary of the writing piece"),
            }),
          )
          .optional()
          .describe(
            "Array of user's published writings, articles, or written works",
          ),
      })
      .optional()
      .describe(
        "Public profile information including bio, projects, work experience, writings, and social links. Only present if user has set up their profile.",
      ),
    education: z
      .array(
        z.object({
          from: z
            .string()
            .describe("Start date of education (flexible format)"),
          to: z
            .string()
            .optional()
            .describe("End date of education (optional for ongoing education)"),
          degree: z
            .string()
            .describe("Degree, diploma, or educational qualification earned"),
          institution: z
            .string()
            .describe("Educational institution or organization name"),
          location: z
            .string()
            .optional()
            .describe("Education location (city, remote, etc.)"),
          url: z
            .string()
            .optional()
            .describe("Institution website or program URL"),
          description: z
            .string()
            .optional()
            .describe("Description of the education program or achievements"),
        }),
      )
      .optional()
      .describe("Array of educational background entries"),
    certification: z
      .array(
        z.object({
          issued: z
            .string()
            .describe(
              "Date when the certification was issued (flexible format)",
            ),
          expire: z
            .string()
            .optional()
            .describe(
              "Expiration date of certification (optional for non-expiring certifications)",
            ),
          name: z.string().describe("Name or title of the certification"),
          organization: z
            .string()
            .describe(
              "Organization or institution that issued the certification",
            ),
          url: z
            .string()
            .optional()
            .describe("URL to verify or view the certification"),
          description: z
            .string()
            .optional()
            .describe("Description of the certification or skills covered"),
        }),
      )
      .optional()
      .describe("Array of professional certifications and credentials"),
    speaking: z
      .array(
        z.object({
          title: z.string().describe("Title of the speaking engagement"),
          year: z
            .string()
            .describe("Year when the speaking engagement took place"),
          event: z
            .string()
            .optional()
            .describe("Name of the event, conference, or venue"),
          location: z
            .string()
            .optional()
            .describe("Location where the speaking engagement took place"),
          url: z
            .string()
            .optional()
            .describe("URL to view recording, slides, or event details"),
          description: z
            .string()
            .optional()
            .describe(
              "Description of the speaking engagement or topic covered",
            ),
        }),
      )
      .optional()
      .describe("Array of speaking engagements and presentations"),
    award: z
      .array(
        z.object({
          title: z.string().describe("Title or name of the award"),
          year: z.string().describe("Year when the award was received"),
          presenter: z
            .string()
            .describe("Organization or entity that presented the award"),
          url: z
            .string()
            .optional()
            .describe("URL to view award details or verification"),
          description: z
            .string()
            .optional()
            .describe("Description of the award or achievement"),
        }),
      )
      .optional()
      .describe("Array of award and recognitions received"),
    volunteering: z
      .array(
        z.object({
          title: z
            .string()
            .describe("Title or role of the volunteering position"),
          organization: z
            .string()
            .describe("Organization or institution for volunteering"),
          location: z
            .string()
            .optional()
            .describe("Location where the volunteering took place"),
          url: z
            .string()
            .optional()
            .describe("URL of the organization or volunteering program"),
          description: z
            .string()
            .optional()
            .describe("Description of the volunteering role and activities"),
          from: z
            .string()
            .describe("Start date of volunteering (flexible format)"),
          to: z
            .string()
            .optional()
            .describe(
              "End date of volunteering (optional for ongoing volunteering)",
            ),
        }),
      )
      .optional()
      .describe("Array of volunteering experiences and community service"),
  })
  .describe(
    "Complete user details response including account info, nickname status, and public profile data",
  );

export type UserDetailsRequest = z.infer<typeof UserDetailsRequestSchema>;
export type UserDetailsResponse = z.infer<typeof UserDetailsResponseSchema>;
