import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";

import { RegardeAccount, RegardeProfile } from "@regarde-dev/jazz-schemas/regarde.bio";

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

export const profilePageHandler = () => {
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
      const userDetails = await getUserDetails(nickname);

      if (!userDetails.exists || !userDetails.publicData) {
        const html = generateNotFoundHTML(nickname, isCrawler);
        return c.html(html, 404, {
          "Cache-Control": "public, max-age=300",
        });
      }

      const html = generateProfileHTML(userDetails.publicData, nickname, isCrawler);
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

async function getUserDetails(nickname: string) {
  // Call api.regarde.dev /lookup endpoint to resolve nickname
  let accountIdFromNickname: string | undefined;

  try {
    const authServiceUrl = process.env.AUTH_SERVICE_URL || "https://api.regarde.dev";
    const lookupUrl = `${authServiceUrl}/lookup/${encodeURIComponent(nickname)}`;

    const lookupResponse = await fetch(lookupUrl);

    if (lookupResponse.status === 404) {
      return { exists: false, publicData: null };
    }

    if (!lookupResponse.ok) {
      console.error(`api.regarde.dev lookup API returned error: ${lookupResponse.status}`);
      return { exists: false, publicData: null };
    }

    const lookupData = await lookupResponse.json();
    accountIdFromNickname = lookupData.accountId;
  } catch (error) {
    console.error(`Error calling api.regarde.dev lookup API for nickname "${nickname}":`, error);
    return { exists: false, publicData: null };
  }

  if (!accountIdFromNickname) {
    return { exists: false, publicData: null };
  }

  try {
    const jazzUserAccount = await RegardeAccount.load(accountIdFromNickname, {
      resolve: { profile: { "regarde.bio": true } },
    });

    if (!jazzUserAccount?.profile?.["regarde.bio"]) {
      return { exists: false, publicData: null };
    }

    const profileData = await RegardeProfile.load(jazzUserAccount.profile["regarde.bio"], {
      resolve: {
        avatarImage: { original: true },
        socialLinks: true,
      },
    });

    return {
      exists: true,
      publicData: profileData,
    };
  } catch (error) {
    console.error("Error loading profile:", error);
    return { exists: false, publicData: null };
  }
}

function generateProfileHTML(profile: any, nickname: string, isCrawler: boolean): string {
  const name = profile.name || nickname;
  const bio = profile.bio || `Check out ${name}'s profile on Jazz`;
  const title = `${name} (@${nickname}) - regarde.bio`;
  const profileUrl = `https://regarde.bio/${nickname}`;

  let imageUrl = "";
  if (profile.avatarImage?.original) {
    try {
      const blob = profile.avatarImage.original.toBlob();
      if (blob) {
        imageUrl = `https://api.regarde.bio/avatar/${nickname}`;
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
        window.location.href = 'https://regarde.bio/${nickname}';
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
  <meta property="og:site_name" content="regarde.bio">
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
    <p><a href="https://regarde.bio/${nickname}">View full profile →</a></p>
  </div>
</body>
</html>`;
}

function generateNotFoundHTML(nickname: string, isCrawler: boolean): string {
  const title = "Profile Not Found - regarde.bio";
  const description = `The profile @${nickname} could not be found.`;

  const redirectScript = isCrawler
    ? ""
    : `
    <script>
      setTimeout(() => {
        window.location.href = 'https://regarde.bio/';
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
    <p><a href="https://regarde.bio/">Go to homepage →</a></p>
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
        window.location.href = 'https://regarde.bio/${nickname}';
      }, 1000);
    </script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Error Loading Profile - regarde.bio</title>
  ${redirectScript}
</head>
<body>
  <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 1rem; text-align: center;">
    <h1>Error Loading Profile</h1>
    <p>There was an error loading this profile. Please try again.</p>
    <p><a href="https://regarde.bio/${nickname}">Try again →</a></p>
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
