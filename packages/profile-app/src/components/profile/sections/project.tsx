import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { Button } from '#/components/ui/button';
import { OnboardingProfile, Project } from '#/lib/schema';
import { getValidUrl } from '#/lib/utils';

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
      className="mx-auto flex flex-col gap-3 my-8"
      style={{ width: '540px' }}
    >
      <h3 className="text-md font-sans">Projects</h3>
      <div className="space-y-6">
        {projects.map((project: any) => {
          const displayTitle = project.client
            ? `${project.title || 'Untitled Project'} @${project.client}`
            : project.title || 'Untitled Project';

          const projectLink = getValidUrl(project.link);

          return (
            <div
              key={project.id}
              className="flex flex-col border-b border-border pb-4 gap-3"
            >
              <div className="flex flex-row gap-4">
                <div className="flex flex-col w-20 flex-shrink-0">
                  <span className="text-sm font-sans text-secondary-foreground">
                    {project.year || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col flex-grow gap-1">
                  <div>
                    {projectLink ? (
                      <Button
                        variant="link-title"
                        asChild
                        size="title"
                        className="inline-flex items-center group"
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
                    <p className="text-sm text-secondary-foreground whitespace-pre-wrap">
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
