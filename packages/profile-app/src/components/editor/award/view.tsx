import { Loaded } from 'jazz-tools';
import { useState } from 'react';

import { Button, DestructiveConfirmationDialog } from '#/components/ui';
import { Award, ListOfAward, OnboardingProfile } from '#/lib/schema';
import { useAward } from '../../../lib/hook/useAward.ts';
import { EditorFooter } from '../index';
import { SectionHeader } from './../layout/header';
import { AwardCard } from './card';

type AwardViewProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
  awards: Loaded<typeof ListOfAward> | undefined;
  onAddAward: () => void;
  onEditAward: (award: Loaded<typeof Award>) => void;
  onClose?: () => void;
};

export function AwardView({
  profile,
  triggerSyncIndicator,
  awards,
  onAddAward,
  onEditAward,
  onClose,
}: AwardViewProps) {
  const { deleteAward } = useAward({ profile, triggerSyncIndicator });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    award: Loaded<typeof Award> | null;
  }>({
    isOpen: false,
    award: null,
  });

  const handleDeleteAward = (award: Loaded<typeof Award>) => {
    setDeleteConfirmation({
      isOpen: true,
      award,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.award?.id) {
      deleteAward(deleteConfirmation.award.id);
    }
    setDeleteConfirmation({ isOpen: false, award: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, award: null });
  };

  const handleClose = () => {
    onClose?.();
  };

  const getAwardDisplayName = (award: Loaded<typeof Award>) => {
    return award.title || 'Untitled Award';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-secondary">
        <SectionHeader
          title="Awards"
          description="Highlight your achievements and recognitions."
          onActionClick={onAddAward}
          actionText="Add Award"
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {(!awards || awards.length === 0) && (
          <div className="flex flex-col items-center py-20">
            <Button variant="ghost" size="sm" onClick={onAddAward}>
              Add an award or recognition you've received
            </Button>
          </div>
        )}

        {awards && awards.length > 0 && (
          <div className="space-y-6 pb-4">
            {awards
              .filter((award): award is Loaded<typeof Award> => award !== null)
              .map((award) => (
                <AwardCard
                  key={award.id}
                  award={award}
                  onEdit={onEditAward}
                  onDelete={handleDeleteAward}
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

      <DestructiveConfirmationDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => !open && cancelDelete()}
        title="Delete Award"
        description={
          deleteConfirmation.award ? (
            <>
              Are you sure you want to delete the award{' '}
              <strong>{getAwardDisplayName(deleteConfirmation.award)}</strong>
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
