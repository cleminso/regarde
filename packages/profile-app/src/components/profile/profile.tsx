import { useAccount } from "jazz-react";
import { OnboardingProfile } from "../../lib/schema.ts";
import { Button } from "../ui/button.tsx";
import { MoreHorizontalIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu.tsx";
import { useNavigate } from "react-router-dom";

// Define social link configurations outside the component for stable reference
// Explicitly type 'key' to ensure it matches properties of SocialLinks schema
const socialLinkConfigs: {
  key: "github" | "twitter" | "website";
  label: string;
}[] = [
  { key: "github", label: "GitHub" },
  { key: "twitter", label: "Twitter" },
  { key: "website", label: "Website" }, // Included as per prompt's examples "twitter; github; website"
];

export function ProfilePage() {
  const { me } = useAccount({
    resolve: {
      profile: {
        socialLinks: true,
      },
    },
  });
  const navigate = useNavigate();

  if (!me || !me.profile) {
    return (
      <div className="flex w-full justify-center items-center min-h-screen">
        <p>Loading profile...</p>
      </div>
    );
  }

  const profile = me.profile as OnboardingProfile;

  const getHref = (url?: string): string | undefined => {
    if (!url) return undefined;
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `https://${url}`;
  };

  const getWebsiteDisplayName = (url?: string): string | undefined => {
    if (!url) return undefined;
    try {
      const fullUrl =
        url.startsWith("http://") || url.startsWith("https://")
          ? url
          : `https://${url}`;
      const parsedUrl = new URL(fullUrl);
      let hostname = parsedUrl.hostname;
      if (hostname.startsWith("www.")) {
        hostname = hostname.substring(4);
      }
      // For paths like github.com/user, return the path as well.
      if (parsedUrl.pathname !== "/" && parsedUrl.pathname !== "") {
        // Avoid adding multiple slashes if pathname already starts with one (it should)
        const path = parsedUrl.pathname.startsWith("/")
          ? parsedUrl.pathname.substring(1)
          : parsedUrl.pathname;
        // remove trailing slash from path if any
        const cleanPath = path.endsWith("/") ? path.slice(0, -1) : path;
        if (cleanPath) {
          hostname = `${hostname}/${cleanPath}`;
        }
      }
      return hostname;
    } catch (e) {
      // Fallback for invalid URLs or simple strings that are not full URLs
      let displayName = url.replace(/^https?:\/\//, "");
      if (displayName.startsWith("www.")) {
        displayName = displayName.substring(4);
      }
      if (displayName.endsWith("/")) {
        displayName = displayName.slice(0, -1);
      }
      return displayName;
    }
  };

  const websiteUrl = profile.socialLinks?.website; // Use optional chaining
  const websiteHref = getHref(websiteUrl);
  const websiteDisplayName = getWebsiteDisplayName(websiteUrl);

  // Prepare social links for the "Contact" section
  // Filter out links that don't have a URL and prepare data for rendering
  const availableSocialLinks = socialLinkConfigs
    .map((config) => {
      const urlValue = profile.socialLinks?.[config.key]; // Safely access URL
      if (!urlValue) {
        return null; // If no URL, this link won't be rendered
      }
      const hrefValue = getHref(urlValue);
      const displayNameValue = getWebsiteDisplayName(urlValue);

      // Ensure href and displayName are valid before including
      if (!hrefValue || !displayNameValue) {
        return null;
      }

      return {
        key: config.key,
        label: config.label,
        url: urlValue,
        href: hrefValue,
        displayName: displayNameValue,
      };
    })
    .filter((link) => link !== null) as {
    // Type assertion after filtering nulls
    key: "github" | "twitter" | "website";
    label: string;
    url: string;
    href: string;
    displayName: string;
  }[];

  return (
    <main className="w-full py-8">
      {/* Profile Header Section (Avatar, Name, Website Badge) */}
      <section
        className="mx-auto flex flex-row items-start gap-4" // Spacing handled by my-8 on subsequent sections
        style={{ width: "540px" }}
      >
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt={`${profile.name}'s avatar`}
            className="w-24 h-24 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-center flex-shrink-0">
            <span className="text-sm">No Avatar</span>
          </div>
        )}
        <div className="flex flex-col gap-2 pt-2">
          <h2 className="text-2xl font-bold">{profile.name}</h2>
          {websiteHref && websiteDisplayName && (
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
              title={`Visit ${profile.name}'s website: ${websiteHref}`}
            >
              <span>{websiteDisplayName}</span>
            </a>
          )}
        </div>
        <div className="flex flex-col w-full h-full">
          <div className="flex justify-end my-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-8 h-8 p-0">
                  <MoreHorizontalIcon className="w-4 h-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate("/edit")}>
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        className="mx-auto flex flex-col gap-2 my-8" // Changed to flex-col, added gap and consistent margin
        style={{ width: "540px" }}
      >
        <h3 className="text-lg font-semibold">About</h3>{" "}
        {/* Updated H3 styling */}
        {profile.bio ? (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {profile.bio}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No bio provided.
          </p>
        )}
      </section>

      {/* Contact Section */}
      <section
        className="mx-auto flex flex-col gap-3 my-8" // gap-3 between H3 and the list of links
        style={{ width: "540px" }}
      >
        <h3 className="text-lg font-semibold">Contact</h3>
        {availableSocialLinks.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {" "}
            {/* gap-2.5 (10px) between each social link row */}
            {availableSocialLinks.map((link) => (
              <div key={link.key} className="flex w-full items-center">
                <div className="w-1/4 text-sm text-muted-foreground capitalize">
                  {link.label}
                </div>
                <div className="w-3/4">
                  <Button
                    asChild
                    variant="link"
                    // Custom styling for link-like appearance
                    className="p-0 h-auto justify-start text-sm font-medium text-primary hover:text-primary/90"
                    title={`Visit ${profile.name}'s ${link.label}: ${link.href}`}
                  >
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.displayName}
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">
            No contact links provided.
          </p>
        )}
      </section>
    </main>
  );
}
