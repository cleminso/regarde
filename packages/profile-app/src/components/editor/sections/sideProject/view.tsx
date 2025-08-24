import { Loaded } from 'jazz-tools';
import { useState } from 'react';

import { Button, DestructiveConfirmationDialog } from '#/components/ui';
import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useSideProject } from '#/lib/hook/useSideProject.ts';
import { JazzAppProfile, ListOfSideProject, SideProject } from '#/lib/schema';
import { EditorFooter } from '../../index';
import { SectionHeader } from './../../layout/header';
import { SideProjectCard } from './card';

type SideProjectViewProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  sideProjects: Loaded<typeof ListOfSideProject> | undefined;
  onAddSideProject: () => void;
  onEditSideProject: (sideProject: Loaded<typeof SideProject>) => void;
  onClose?: () => void;
};

export function SideProjectView({
  profile,
  triggerSyncIndicator,
  sideProjects,
  onAddSideProject,
  onEditSideProject,
  onClose,
}: SideProjectViewProps) {
  const { deleteSideProject } = useSideProject({
    profile,
    triggerSyncIndicator,
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    sideProject: Loaded<typeof SideProject> | null;
  }>({
    isOpen: false,
    sideProject: null,
  });

  const handleDeleteSideProject = (sideProject: Loaded<typeof SideProject>) => {
    setDeleteConfirmation({
      isOpen: true,
      sideProject,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.sideProject?.id) {
      deleteSideProject(deleteConfirmation.sideProject.id);
    }
    setDeleteConfirmation({ isOpen: false, sideProject: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, sideProject: null });
  };

  const handleClose = () => {
    onClose?.();
  };

  const getSideProjectDisplayName = (
    sideProject: Loaded<typeof SideProject>,
  ) => {
    return sideProject.title || 'Untitled Side Project';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <SectionHeader
          title="Side Projects"
          description="Showcase your personal projects and experiments."
          onActionClick={onAddSideProject}
          actionText="Add Side Project"
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {(!sideProjects || sideProjects.length === 0) && (
          <div className="flex flex-col items-center py-20">
            <Button variant="ghost" size="sm" onClick={onAddSideProject}>
              Add a personal project you're proud of
            </Button>
          </div>
        )}

        {sideProjects && sideProjects.length > 0 && (
          <div className="space-y-6 pb-4">
            {sideProjects
              .filter(
                (sideProject): sideProject is Loaded<typeof SideProject> =>
                  sideProject !== null,
              )
              .map((sideProject) => (
                <SideProjectCard
                  key={sideProject.id}
                  sideProject={sideProject}
                  onEdit={onEditSideProject}
                  onDelete={handleDeleteSideProject}
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
        title="Delete Side Project"
        description={
          deleteConfirmation.sideProject ? (
            <>
              Are you sure you want to delete the side project{' '}
              <strong>
                {getSideProjectDisplayName(deleteConfirmation.sideProject)}
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
