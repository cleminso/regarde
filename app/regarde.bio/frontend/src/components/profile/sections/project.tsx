import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import type { RegardeProfile, Project } from '#/lib/schema';
import { formatYearString, getValidUrl } from '#/lib/utils/utils';

type ProjectsProps = {
  profile: Loaded<typeof RegardeProfile>;
};

export function Projects({ profile }: ProjectsProps) {
  const projects = profile.projects?.$isLoaded 
    ? profile.projects.filter(
        (project: any): project is Loaded<typeof Project> => project?.$isLoaded === true,
      )
    : [];

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <div className="@container">
      <section className="w-full max-w-[580px] mx-auto flex flex-col gap-4  mb-6">
        <div className="flex items-center gap-4">
          <h3 className="bg-secondary w-full px-2 py-1 text-md font-sans whitespace-nowrap flex items-center justify-start min-h-[2rem]">
            PROJECTS
          </h3>
        </div>

        <div className="space-y-6">
          {projects.map((project: any) => {
            const displayTitle = project.client
              ? `${project.title || 'Untitled Project'} @${project.client}`
              : project.title || 'Untitled Project';

            const projectLink = getValidUrl(project.link);

            return (
              <div key={project.$jazz.id} className="flex flex-col pb-4 gap-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-sans text-muted-foreground">
                      {formatYearString(project.year)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="min-w-0 flex-1">
                      {projectLink ? (
                        <Button
                          variant="link-title"
                          asChild
                          size="title"
                          className="inline-flex items-center group -mx-1 justify-start overflow-hidden"
                        >
                          <a
                            href={projectLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 flex items-center gap-1 max-w-full"
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
                          className="justify-start overflow-hidden -mx-1 max-w-full"
                        >
                          <span className="truncate">{displayTitle}</span>
                        </Button>
                      )}
                    </div>
                    {project.description && (
                      <p className="text-sm text-muted-foreground whitespace-pre-line wrap-break-words pr-1">
                        {project.description}
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
