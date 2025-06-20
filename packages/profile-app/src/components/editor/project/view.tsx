import { Loaded } from 'jazz-tools';
import { useState } from 'react';

import { ConfirmationDialog } from '#/components/confirmation-dialog';
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Loaded<
    typeof Project
  > | null>(null);

  const initiateDeleteProject = (project: Loaded<typeof Project>) => {
    setProjectToDelete(project);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProject = () => {
    if (projectToDelete && projectToDelete.id) {
      deleteProject(projectToDelete.id);
    } else {
      console.error(
        'Attempted to delete a project without an ID or projectToDelete is null.',
        projectToDelete,
      );
    }
    setProjectToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setProjectToDelete(null);
    }
    setIsDeleteDialogOpen(open);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <SectionHeader
          title="Projects"
          description="Showcase your projects and contributions."
          onActionClick={onAddProject}
          actionText="Add Project"
        />

        {(!projects || projects.length === 0) && (
          <div className="flex flex-col items-center py-20">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddProject}
              className="border-none"
            >
              Add a work project you're proud of
            </Button>
          </div>
        )}

        {projects && projects.length > 0 && (
          <div className="space-y-6">
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
                  onDelete={initiateDeleteProject}
                />
              ))}
          </div>
        )}
      </div>

      <EditorFooter
        primaryAction={{
          text: 'Done',
          onClick: onClose || (() => {}),
        }}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={handleDialogClose}
        title="Delete project?"
        description="This action cannot be undone. This will permanently delete this project from your profile."
        onConfirm={confirmDeleteProject}
        confirmButtonText="Delete"
        confirmButtonVariant="destructive"
      />
    </div>
  );
}
