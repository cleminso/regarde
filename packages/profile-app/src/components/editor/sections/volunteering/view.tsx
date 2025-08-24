import { Loaded } from 'jazz-tools';
import { useState } from 'react';

import { Button, DestructiveConfirmationDialog } from '#/components/ui';
import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useVolunteering } from '#/lib/hook/useVolunteering';
import { JazzAppProfile, ListOfVolunteering, Volunteering } from '#/lib/schema';
import { EditorFooter } from '../../index';
import { SectionHeader } from '../../layout/header';
import { VolunteeringCard } from './card';

type VolunteeringViewProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  volunteering: Loaded<typeof ListOfVolunteering> | undefined;
  onAddVolunteering: () => void;
  onEditVolunteering: (volunteering: Loaded<typeof Volunteering>) => void;
  onClose?: () => void;
};

export function VolunteeringView({
  profile,
  triggerSyncIndicator,
  volunteering,
  onAddVolunteering,
  onEditVolunteering,
  onClose,
}: VolunteeringViewProps) {
  const { deleteVolunteering } = useVolunteering({
    profile,
    triggerSyncIndicator,
  });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    volunteering: Loaded<typeof Volunteering> | null;
  }>({
    isOpen: false,
    volunteering: null,
  });

  const handleDeleteVolunteering = (
    volunteeringItem: Loaded<typeof Volunteering>,
  ) => {
    setDeleteConfirmation({
      isOpen: true,
      volunteering: volunteeringItem,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.volunteering?.id) {
      deleteVolunteering(deleteConfirmation.volunteering.id);
    }
    setDeleteConfirmation({ isOpen: false, volunteering: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, volunteering: null });
  };

  const handleClose = () => {
    onClose?.();
  };

  const getVolunteeringDisplayName = (
    volunteeringItem: Loaded<typeof Volunteering>,
  ) => {
    const title = volunteeringItem.title || 'Untitled Role';
    const organization =
      volunteeringItem.organization || 'Unnamed Organization';
    return `${title} at ${organization}`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <SectionHeader
          title="Volunteering"
          description="Share your volunteer work and community involvement."
          onActionClick={onAddVolunteering}
          actionText="Add Volunteering"
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {(!volunteering || volunteering.length === 0) && (
          <div className="flex flex-col items-center py-20">
            <Button variant="ghost" size="sm" onClick={onAddVolunteering}>
              Add volunteer work you're proud of
            </Button>
          </div>
        )}

        {volunteering && volunteering.length > 0 && (
          <div className="space-y-6 pb-4">
            {volunteering
              .filter(
                (
                  volunteeringItem,
                ): volunteeringItem is Loaded<typeof Volunteering> =>
                  volunteeringItem !== null,
              )
              .map((volunteeringItem) => (
                <VolunteeringCard
                  key={volunteeringItem.id}
                  volunteering={volunteeringItem}
                  onEdit={onEditVolunteering}
                  onDelete={handleDeleteVolunteering}
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
        title="Delete Volunteering"
        description={
          deleteConfirmation.volunteering ? (
            <>
              Please confirm you'd like to delete{' '}
              <strong>
                {getVolunteeringDisplayName(deleteConfirmation.volunteering)}
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
