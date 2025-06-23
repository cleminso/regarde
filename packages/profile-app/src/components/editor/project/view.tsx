import { Loaded } from 'jazz-tools';

import { Button } from '#/components/ui';
import { ListOfProjects, OnboardingProfile, Project } from '#/lib/schema';
import { useProject } from '../../../lib/hook/useProject.ts';
import { EditorFooter } from '../index';
import { SectionHeader } from './../layout/header';
import { ProjectCard } from './card';

type ProjectViewProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
  projects: Loaded<typeof ListOfProjects> | undefined;
  onAddProject: () => void;
  onEditProject: (project: Loaded<typeof Project>) => void;
  onClose?: () => void;
};

export function ProjectView({
  profile,
  triggerSyncIndicator,
  projects,
  onAddProject,
  onEditProject,
  onClose,
}: ProjectViewProps) {
  const { deleteProject } = useProject({ profile, triggerSyncIndicator });

  const handleDeleteProject = (project: Loaded<typeof Project>) => {
    if (project.id) {
      deleteProject(project.id);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-secondary">
        <SectionHeader
          title="Projects"
          description="Showcase your projects and contributions."
          onActionClick={onAddProject}
          actionText="Add Project"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {(!projects || projects.length === 0) && (
          <div className="flex flex-col items-center py-20">
            <Button variant="ghost" size="sm" onClick={onAddProject}>
              Add a work project you're proud of
            </Button>
          </div>
        )}

        {projects && projects.length > 0 && (
          <div className="space-y-6 pb-4">
            {projects
              .filter(
                (project): project is Loaded<typeof Project> =>
                  project !== null,
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

      <div className="flex-shrink-0 bg-secondary">
        <EditorFooter
          primaryAction={{
            text: 'Done',
            onClick: handleClose,
          }}
        />
      </div>
    </div>
  );
}
