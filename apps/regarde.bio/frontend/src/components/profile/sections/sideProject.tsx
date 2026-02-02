import type { RegardeProfile, SideProject } from "#/lib/schema";
import { Loaded } from "jazz-tools";
import { ArrowUpRight } from "lucide-react";

import { Button } from "#/components/ui/button";
import { formatYearString, getValidUrl } from "#/lib/utils/utils";

type SideProjectsProps = {
  profile: Loaded<typeof RegardeProfile>;
};

export function SideProjects({ profile }: SideProjectsProps) {
  const sideProjects = profile.sideProject?.$isLoaded
    ? profile.sideProject.filter(
        (sideProject: any): sideProject is Loaded<typeof SideProject> =>
          sideProject?.$isLoaded === true,
      )
    : [];

  if (!sideProjects || sideProjects.length === 0) {
    return null;
  }

  return (
    <div className="@container">
      <section className="mx-auto mb-6 flex w-full max-w-[580px] flex-col gap-4">
        <div className="flex items-center gap-4">
          <h3 className="bg-secondary text-md flex min-h-[2rem] w-full items-center justify-start px-2 py-1 font-sans whitespace-nowrap">
            SIDE PROJECTS
          </h3>
        </div>
        <div className="space-y-6">
          {sideProjects.map((sideProject: any) => {
            const displayTitle = sideProject.client
              ? `${sideProject.title || "Untitled Side Project"} @${sideProject.client}`
              : sideProject.title || "Untitled Side Project";

            const sideProjectLink = getValidUrl(sideProject.url);

            return (
              <div key={sideProject.$jazz.id} className="flex flex-col gap-3 pb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-sans text-sm">
                      {formatYearString(sideProject.year)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="min-w-0 flex-1">
                      {sideProjectLink ? (
                        <Button
                          variant="link-title"
                          asChild
                          size="title"
                          className="group -mx-1 inline-flex items-center justify-start overflow-hidden"
                        >
                          <a
                            href={sideProjectLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex max-w-full min-w-0 items-center gap-1"
                          >
                            <span className="truncate">{displayTitle}</span>
                            <ArrowUpRight className="h-4 w-4 shrink-0" />
                          </a>
                        </Button>
                      ) : (
                        <Button
                          variant="link-title"
                          disabled
                          size="title"
                          className="-mx-1 max-w-full justify-start overflow-hidden"
                        >
                          <span className="truncate">{displayTitle}</span>
                        </Button>
                      )}
                    </div>
                    {sideProject.description && (
                      <p className="text-muted-foreground wrap-break-words pr-1 text-sm whitespace-pre-line">
                        {sideProject.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
