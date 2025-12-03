import { Loaded } from 'jazz-tools';
import { useState } from 'react';

import { Button, DestructiveConfirmationDialog } from '#/components/ui';
import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useProject } from '#/lib/hook/useProject.ts';
import { RegardeProfile, ListOfProjects, Project } from '#/lib/schema';
import { EditorFooter } from '../../index';
import { SectionHeader } from './../../layout/header';
import { ProjectCard } from './card';

type ProjectViewProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
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

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    project: Loaded<typeof Project> | null;
  }>({
    isOpen: false,
    project: null,
  });

  const handleDeleteProject = (project: Loaded<typeof Project>) => {
    setDeleteConfirmation({
      isOpen: true,
      project,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.project?.id) {
      deleteProject(deleteConfirmation.project.id);
    }
    setDeleteConfirmation({ isOpen: false, project: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, project: null });
  };

  const handleClose = () => {
    onClose?.();
  };

  const getProjectDisplayName = (project: Loaded<typeof Project>) => {
    return project.title || 'Untitled Project';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <SectionHeader
          title="Projects"
          description="Showcase your projects and contributions."
          onActionClick={onAddProject}
          actionText="Add Project"
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
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

      <div className="flex-shrink-0">
        <EditorFooter
          primaryAction={{
            text: 'Done',
            onClick: handleClose,
          }}
        />
      </div>

      <DestructiveConfirmationDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => !open && cancelDelete()}
        title="Delete Project"
        description={
          deleteConfirmation.project ? (
            <>
              Are you sure you want to delete the project{' '}
              <strong>
                {getProjectDisplayName(deleteConfirmation.project)}
              </strong>
              ?
              <br />
              <br />
              This action cannot be undone.
            </>
          ) : null
        }
        onConfirm={confirmDelete}
        confirmButtonText="Delete"
      />
    </div>
  );
}
