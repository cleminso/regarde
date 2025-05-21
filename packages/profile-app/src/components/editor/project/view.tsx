import { Loaded } from 'jazz-tools';

import { Button } from '#/components/ui';
import { ListOfProjects, Project } from '#/lib/schema';
import { SectionHeader } from '../header';
import { ProjectCard } from './card';

type ProjectViewProps = {
  projects: Loaded<typeof ListOfProjects> | undefined;
  onAddProject: () => void;
  onEditProject: (project: Loaded<typeof Project>) => void;
  onDeleteProject: (project: Loaded<typeof Project>) => void;
};

export function ProjectView({
  projects,
  onAddProject,
  onEditProject,
  onDeleteProject,
}: ProjectViewProps) {
  return (
    <div className="space-y-4 w-full">
      <SectionHeader
        title="Projects"
        description="Showcase your projects and contributions."
        onActionClick={onAddProject}
        actionText="Add Project"
      />
      {(!projects || projects.length === 0) && (
        <div className="flex flex-col items-center py-50">
          <Button variant="outline" size="sm" onClick={onAddProject}>
            Add projects eveyone should know you work hard on it.
          </Button>
        </div>
      )}
      {projects && projects.length > 0 && (
        <div className="space-y-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={onEditProject}
              onDelete={onDeleteProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
