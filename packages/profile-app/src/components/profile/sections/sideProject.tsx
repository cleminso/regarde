import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import type { JazzAppProfile, SideProject } from '#/lib/schema';
import { formatYearString, getValidUrl } from '#/lib/utils/utils';

type SideProjectsProps = {
  profile: Loaded<typeof JazzAppProfile>;
};

export function SideProjects({ profile }: SideProjectsProps) {
  const sideProjects = profile.sideProject?.filter(
    (sideProject: any): sideProject is Loaded<typeof SideProject> =>
      sideProject !== null,
  );

  if (!sideProjects || sideProjects.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto flex flex-col gap-4 mb-10"
      style={{ width: '580px' }}
    >
      <div className="flex items-center gap-4">
        <h3 className="bg-secondary w-full px-2 py-1 text-md font-sans whitespace-nowrap flex items-center justify-start min-h-[2rem]">
          SIDE PROJECTS
        </h3>
      </div>
      <div className="space-y-6">
        {sideProjects.map((sideProject: any) => {
          const displayTitle = sideProject.client
            ? `${sideProject.title || 'Untitled Side Project'} @${sideProject.client}`
            : sideProject.title || 'Untitled Side Project';

          const sideProjectLink = getValidUrl(sideProject.url);

          return (
            <div key={sideProject.id} className="flex flex-col pb-4 gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-sans text-muted-foreground">
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
                        className="inline-flex items-center group -mx-1 justify-start overflow-hidden"
                      >
                        <a
                          href={sideProjectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-w-0 flex items-center gap-1 max-w-full"
                        >
                          <span className="truncate">{displayTitle}</span>
                          <ArrowUpRight className="h-4 w-4 flex-shrink-0" />
                        </a>
                      </Button>
                    ) : (
                      <Button
                        variant="link-title"
                        disabled
                        size="title"
                        className="justify-start overflow-hidden -mx-1 max-w-full"
                      >
                        <span className="truncate">{displayTitle}</span>
                      </Button>
                    )}
                  </div>
                  {sideProject.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-line break-words pr-1">
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
  );
}
