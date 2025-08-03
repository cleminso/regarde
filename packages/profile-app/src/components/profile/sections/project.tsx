import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { OnboardingProfile, Project } from '#/lib/schema';
import { formatYearString, getValidUrl } from '#/lib/utils';

type ProjectsProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

export function Projects({ profile }: ProjectsProps) {
  const projects = profile.projects?.filter(
    (project: any): project is Loaded<typeof Project> => project !== null,
  );

  if (!projects || projects.length === 0) {
    return null;
  }

  return (
    <section
      className="mx-auto flex flex-col gap-4 mb-10"
      style={{ width: '540px' }}
    >
      <div className="flex items-center gap-4">
        <h3 className="text-md font-sans whitespace-nowrap">Projects</h3>
        <hr className="flex-1 border-border" />
      </div>
      <div className="space-y-6">
        {projects.map((project: any) => {
          const displayTitle = project.client
            ? `${project.title || 'Untitled Project'} @${project.client}`
            : project.title || 'Untitled Project';

          const projectLink = getValidUrl(project.link);

          return (
            <div key={project.id} className="flex flex-col pb-4 gap-3">
              <div className="flex flex-row gap-4">
                <div className="flex flex-col w-24 flex-shrink-0">
                  <span className="text-sm font-sans text-secondary-foreground">
                    {formatYearString(project.year)}{' '}
                  </span>
                </div>
                <div className="flex flex-col flex-grow gap-1">
                  <div className="mb-2">
                    {projectLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group -mx-1"
                      >
                        <a
                          href={projectLink}
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
                  {project.description && (
                    <p className="text-sm text-secondary-foreground whitespace-pre-line">
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
  );
}
