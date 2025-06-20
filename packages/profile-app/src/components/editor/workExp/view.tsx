import { Loaded } from 'jazz-tools';
import { useState } from 'react';

import { ConfirmationDialog } from '#/components/confirmation-dialog';
import { Button } from '#/components/ui';
import { ListOfWorkExp, OnboardingProfile, WorkExp } from '#/lib/schema';
import { useWorkExp } from '../../../lib/hook/useWorkExp';
import { EditorFooter } from '../index';
import { SectionHeader } from '../layout/header';
import { WorkExpCard } from './card';

type WorkExpViewProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workExpToDelete, setWorkExpToDelete] = useState<Loaded<
    typeof WorkExp
  > | null>(null);

  const initiateDeleteWorkExp = (workExp: Loaded<typeof WorkExp>) => {
    setWorkExpToDelete(workExp);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteWorkExp = () => {
    if (workExpToDelete && workExpToDelete.id) {
      deleteWorkExp(workExpToDelete.id);
    } else {
      console.error(
        'Attempted to delete a work experience without an ID or workExpToDelete is null.',
        workExpToDelete,
      );
    }
    setWorkExpToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setWorkExpToDelete(null);
    }
    setIsDeleteDialogOpen(open);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        <SectionHeader
          title="Work Experience"
          description="Detail your professional roles and responsibilities."
          actionText="Add Experience"
          onActionClick={onAddWorkExp}
        />

        {(!workExperiences || workExperiences.length === 0) && (
          <div className="flex flex-col items-center py-20">
            <Button
              variant="outline"
              size="sm"
              onClick={onAddWorkExp}
              className="border-none"
            >
              Add experience you're proud of.
            </Button>
          </div>
        )}

        {workExperiences && workExperiences.length > 0 && (
          <div className="space-y-6">
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
                  onDelete={initiateDeleteWorkExp}
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
        title="Delete work experience?"
        description="This action cannot be undone. This will permanently delete this work experience from your profile."
        onConfirm={confirmDeleteWorkExp}
        confirmButtonText="Delete"
        confirmButtonVariant="destructive"
      />
    </div>
  );
}
