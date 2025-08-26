import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

export const profilePageRoute = createRoute({
  method: "get",
  path: "/{nickname}",
  request: {
    params: z.object({
      nickname: z.string().min(1).max(50),
    }),
  },
  responses: {
    200: {
      content: {
        "text/html": {
          schema: { type: "string" },
        },
      },
      description: "Profile page with Open Graph meta tags",
    },
    404: {
      content: {
        "text/html": {
          schema: { type: "string" },
        },
      },
      description: "Profile not found",
    },
  },
  tags: ["Profile Pages"],
  summary: "Get profile page with meta tags",
  description:
    "Serves HTML page with Open Graph meta tags for social media crawlers, then redirects to React app",
});

export const profilePageHandler = (
  reverseNicknameRegistry: any,
  nicknameRegistry: any,
) => {
  return async (c: any) => {
    console.log("Profile page handler called!");
    console.log("Request path:", c.req.path);
    console.log("Request params:", c.req.param());

    const { nickname } = c.req.valid("param");
    const userAgent = c.req.header("user-agent") || "";

    console.log(`Profile page request for: ${nickname}`);
    console.log(`User-Agent: ${userAgent}`);

    const isCrawler = detectCrawler(userAgent);

    try {
      const userDetails = await getUserDetails(
        nickname,
        reverseNicknameRegistry,
        nicknameRegistry,
      );

      if (!userDetails.exists || !userDetails.publicData) {
        const html = generateNotFoundHTML(nickname, isCrawler);
        return c.html(html, 404, {
          "Cache-Control": "public, max-age=300",
        });
      }

      const html = generateProfileHTML(
        userDetails.publicData,
        nickname,
        isCrawler,
      );
      return c.html(html, 200, {
        "Cache-Control": "public, max-age=3600",
        Vary: "User-Agent",
      });
    } catch (error) {
      console.error(`Error serving profile page for ${nickname}:`, error);
      const html = generateErrorHTML(nickname, isCrawler);
      return c.html(html, 500);
    }
  };
};

function detectCrawler(userAgent: string): boolean {
  const crawlerPatterns = [
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
    /discordbot/i,
    /redditbot/i, 
    /redditbot/i, 
    /slackbot/i,
    /whatsapp/i,
    /telegrambot/i,
    /googlebot/i,
    /bingbot/i,
    /duckduckbot/i,
  ];

  return crawlerPatterns.some((pattern) => pattern.test(userAgent));
}

async function getUserDetails(
  nickname: string,
  reverseNicknameRegistry: any,
  nicknameRegistry: any,
) {
  // Reuse the same logic from userDetailsHandler
  let accountIdFromNickname: string | undefined;

  if (nicknameRegistry && nicknameRegistry[nickname]) {
    accountIdFromNickname = nicknameRegistry[nickname];
  }

  if (!accountIdFromNickname) {
    return { exists: false, publicData: null };
  }

  try {
    const { OnboardingAccount, JazzAppProfile } = await import(
      "@onboarding.jazz/shared-schemas/profile"
    );

    const jazzUserAccount = await OnboardingAccount.load(
      accountIdFromNickname,
      {
        resolve: { profile: { "profile.jazz.dev": true } },
      },
    );

    if (!jazzUserAccount?.profile?.["profile.jazz.dev"]) {
      return { exists: false, publicData: null };
    }

    const profileData = await JazzAppProfile.load(
      jazzUserAccount.profile["profile.jazz.dev"],
      {
        resolve: {
          avatarImage: { original: true },
          socialLinks: true,
        },
      },
    );

    return {
      exists: true,
      publicData: profileData,
    };
  } catch (error) {
    console.error("Error loading profile:", error);
    return { exists: false, publicData: null };
  }
}

function generateProfileHTML(
  profile: any,
  nickname: string,
  isCrawler: boolean,
): string {
  const name = profile.name || nickname;
  const bio = profile.bio || `Check out ${name}'s profile on Jazz`;
  const title = `${name} (@${nickname}) - profile.jazz.dev`;
  const profileUrl = `https://profile.jazz.dev/${nickname}`;

  let imageUrl = "";
  if (profile.avatarImage?.original) {
    try {
      const blob = profile.avatarImage.original.toBlob();
      if (blob) {
        imageUrl = `https://api.jazz.dev/avatar/${nickname}`;
      }
    } catch (error) {
      console.warn("Error processing avatar:", error);
    }
  }

  const redirectScript = isCrawler
    ? ""
    : `
    <script>
      // Redirect browsers to React app after a short delay
      setTimeout(() => {
        window.location.href = 'https://profile.jazz.dev/${nickname}';
      }, 100);
    </script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(bio)}">

  <!-- Open Graph -->
  <meta property="og:title" content="${escapeHtml(name)} (@${nickname})">
  <meta property="og:description" content="${escapeHtml(bio)}">
  <meta property="og:url" content="${profileUrl}">
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="profile.jazz.dev">
  ${imageUrl ? `<meta property="og:image" content="${imageUrl}">` : ""}
  ${imageUrl ? `<meta property="og:image:alt" content="${escapeHtml(name)}'s profile picture">` : ""}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(bio)}">
  ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}">` : ""}

  <!-- Additional meta tags -->
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${profileUrl}">

  ${redirectScript}
</head>
<body>
  <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 1rem;">
    <h1>${escapeHtml(name)} (@${nickname})</h1>
    <p>${escapeHtml(bio)}</p>
    ${!isCrawler ? "<p>Redirecting to full profile...</p>" : ""}
    <p><a href="https://profile.jazz.dev/${nickname}">View full profile →</a></p>
  </div>
</body>
</html>`;
}

function generateNotFoundHTML(nickname: string, isCrawler: boolean): string {
  const title = "Profile Not Found - profile.jazz.dev";
  const description = `The profile @${nickname} could not be found.`;

  const redirectScript = isCrawler
    ? ""
    : `
    <script>
      setTimeout(() => {
        window.location.href = 'https://profile.jazz.dev/';
      }, 2000);
    </script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta name="robots" content="noindex">
  ${redirectScript}
</head>
<body>
  <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 1rem; text-align: center;">
    <h1>Profile Not Found</h1>
    <p>The profile @${nickname} could not be found.</p>
    ${!isCrawler ? "<p>Redirecting to homepage...</p>" : ""}
    <p><a href="https://profile.jazz.dev/">Go to homepage →</a></p>
  </div>
</body>
</html>`;
}

function generateErrorHTML(nickname: string, isCrawler: boolean): string {
  const redirectScript = isCrawler
    ? ""
    : `
    <script>
      setTimeout(() => {
        window.location.href = 'https://profile.jazz.dev/${nickname}';
      }, 1000);
    </script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Error Loading Profile - profile.jazz.dev</title>
  ${redirectScript}
</head>
<body>
  <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 1rem; text-align: center;">
    <h1>Error Loading Profile</h1>
    <p>There was an error loading this profile. Please try again.</p>
    <p><a href="https://profile.jazz.dev/${nickname}">Try again →</a></p>
  </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
