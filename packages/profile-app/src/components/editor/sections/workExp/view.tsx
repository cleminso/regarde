import { Loaded } from 'jazz-tools';
import { useState } from 'react';

import { Button, DestructiveConfirmationDialog } from '#/components/ui';
import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useWorkExp } from '#/lib/hook/useWorkExp';
import { RegardeProfile, ListOfWorkExp, WorkExp } from '#/lib/schema';
import { EditorFooter } from '../../index';
import { SectionHeader } from '../../layout/header';
import { WorkExpCard } from './card';

type WorkExpViewProps = {
  profile: Loaded<typeof RegardeProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  workExperiences: Loaded<typeof ListOfWorkExp> | undefined;
  onAddWorkExp: () => void;
  onEditWorkExp: (workExp: Loaded<typeof WorkExp>) => void;
  onClose?: () => void;
};

export function WorkExpView({
  profile,
  triggerSyncIndicator,
  workExperiences,
  onAddWorkExp,
  onEditWorkExp,
  onClose,
}: WorkExpViewProps) {
  const { deleteWorkExp } = useWorkExp({ profile, triggerSyncIndicator });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    workExp: Loaded<typeof WorkExp> | null;
  }>({
    isOpen: false,
    workExp: null,
  });

  const handleDeleteWorkExp = (workExp: Loaded<typeof WorkExp>) => {
    setDeleteConfirmation({
      isOpen: true,
      workExp,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.workExp?.id) {
      deleteWorkExp(deleteConfirmation.workExp.id);
    }
    setDeleteConfirmation({ isOpen: false, workExp: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, workExp: null });
  };

  const handleClose = () => {
    onClose?.();
  };

  const getWorkExpDisplayName = (workExp: Loaded<typeof WorkExp>) => {
    const title = workExp.title || 'Untitled Role';
    const company = workExp.company || 'Unnamed Company';
    return `${title} at ${company}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <SectionHeader
          title="Work Experience"
          description="Detail your roles and responsibilities."
          onActionClick={onAddWorkExp}
          actionText="Add Experience"
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {(!workExperiences || workExperiences.length === 0) && (
          <div className="flex flex-col items-center py-20">
            <Button variant="ghost" size="sm" onClick={onAddWorkExp}>
              Add experience you're proud of
            </Button>
          </div>
        )}

        {workExperiences && workExperiences.length > 0 && (
          <div className="space-y-6 pb-4">
            {workExperiences
              .filter(
                (workExp): workExp is Loaded<typeof WorkExp> =>
                  workExp !== null,
              )
              .map((workExp) => (
                <WorkExpCard
                  key={workExp.id}
                  workExp={workExp}
                  onEdit={onEditWorkExp}
                  onDelete={handleDeleteWorkExp}
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
        title="Delete Work Experience"
        description={
          deleteConfirmation.workExp ? (
            <>
              Please confirm you'd to delete{' '}
              <strong>
                {getWorkExpDisplayName(deleteConfirmation.workExp)}
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
