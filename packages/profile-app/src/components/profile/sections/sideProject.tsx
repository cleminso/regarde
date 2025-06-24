import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { OnboardingProfile, SideProject } from '#/lib/schema';
import { getValidUrl } from '#/lib/utils';

type SideProjectsProps = {
  profile: Loaded<typeof OnboardingProfile>;
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
      className="mx-auto flex flex-col gap-3 my-8"
      style={{ width: '540px' }}
    >
      <h3 className="text-md font-sans">Side Projects</h3>
      <div className="space-y-6">
        {sideProjects.map((sideProject: any) => {
          const displayTitle = sideProject.client
            ? `${sideProject.title || 'Untitled Side Project'} @${sideProject.client}`
            : sideProject.title || 'Untitled Side Project';

          const sideProjectLink = getValidUrl(sideProject.url);

          return (
            <div
              key={sideProject.id}
              className="flex flex-col border-b border-border pb-4 gap-3"
            >
              <div className="flex flex-row gap-4">
                <div className="flex flex-col w-24 flex-shrink-0">
                  <span className="text-sm font-sans text-secondary-foreground">
                    {sideProject.year || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col flex-grow gap-1">
                  <div>
                    {sideProjectLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group"
                      >
                        <a
                          href={sideProjectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {displayTitle}
                          <ArrowUpRight className="h-4 w-4 ml-1" />
                        </a>
                      </Button>
                    ) : (
                      <Button variant="link-title" disabled size="title">
                        {displayTitle}
                      </Button>
                    )}
                  </div>
                  {sideProject.description && (
                    <p className="text-sm text-secondary-foreground whitespace-pre-wrap">
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
