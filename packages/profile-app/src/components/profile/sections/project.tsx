import { Loaded } from 'jazz-tools';
import { ArrowUpRight } from 'lucide-react';

import { OnboardingProfile, Project } from '#/lib/schema';

type ProjectsProps = {
  profile: Loaded<typeof OnboardingProfile>;
};

export function Projects({ profile }: ProjectsProps) {
  const projects = profile.projects?.filter(
    (project): project is Loaded<typeof Project> => project !== null,
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
        {projects.map((project) => {
          const displayTitle = project.client
            ? `${project.title || 'Untitled Project'} @${project.client}`
            : project.title || 'Untitled Project';

          const projectLink = project.link
            ? project.link.startsWith('http://') ||
              project.link.startsWith('https://')
              ? project.link
              : `https://${project.link}`
            : undefined;

          return (
            <div
              key={project.id}
              className="flex flex-col border-b border-border pb-4 gap-3"
            >
              <div className="flex flex-row gap-4">
                <div className="flex flex-col w-20 flex-shrink-0">
                  <span className="text-sm font-sans text-muted-foreground">
                    {project.year || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col flex-grow gap-1">
                  <div>
                    {projectLink ? (
                      <a
                        href={projectLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base font-medium text-foreground hover:underline hover:underline-offset-4 inline-flex items-center group"
                      >
                        {displayTitle}
                        <ArrowUpRight className="h-4 w-4 ml-1" />
                      </a>
                    ) : (
                      <h4 className="text-base font-medium text-foreground">
                        {displayTitle}
                      </h4>
                    )}
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
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
