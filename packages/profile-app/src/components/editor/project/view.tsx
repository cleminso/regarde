import { Loaded } from 'jazz-tools';

import { Button } from '#/components/ui';
import { ListOfProjects, OnboardingProfile, Project } from '#/lib/schema';
import { useProject } from '../../../lib/hook/useProject.ts';
import { SectionHeader } from '../header';
import { ProjectCard } from './card';

type ProjectViewProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
  projects: Loaded<typeof ListOfProjects> | undefined;
  onAddProject: () => void;
  onEditProject: (project: Loaded<typeof Project>) => void;
};

export function ProjectView({
  profile,
  triggerSyncIndicator,
  projects,
  onAddProject,
  onEditProject,
}: ProjectViewProps) {
  const { deleteProject } = useProject({ profile, triggerSyncIndicator });

  const handleDeleteProject = (projectToDelete: Loaded<typeof Project>) => {
    if (projectToDelete && projectToDelete.id) {
      deleteProject(projectToDelete.id);
    } else {
      console.error(
        'Attempted to delete a project without an ID.',
        projectToDelete,
      );
    }
  };

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
          {projects
            .filter(
              (project): project is Loaded<typeof Project> => project !== null,
            )
            .map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={onEditProject}
                onDelete={handleDeleteProject}
              />
            ))}
        </div>
      )}
    </div>
  );
}
