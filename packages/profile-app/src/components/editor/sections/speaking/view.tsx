import { Loaded } from 'jazz-tools';
import { useState } from 'react';

import { Button, DestructiveConfirmationDialog } from '#/components/ui';
import { TriggerSyncIndicator } from '#/lib/hook/types.ts';
import { useSpeaking } from '#/lib/hook/useSpeaking.ts';
import { JazzAppProfile, ListOfSpeaking, Speaking } from '#/lib/schema';
import { EditorFooter } from '../../index';
import { SectionHeader } from './../../layout/header';
import { SpeakingCard } from './card';

type SpeakingViewProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  speaking: Loaded<typeof ListOfSpeaking> | undefined;
  onAddSpeaking: () => void;
  onEditSpeaking: (speaking: Loaded<typeof Speaking>) => void;
  onClose?: () => void;
};

export function SpeakingView({
  profile,
  triggerSyncIndicator,
  speaking,
  onAddSpeaking,
  onEditSpeaking,
  onClose,
}: SpeakingViewProps) {
  const { deleteSpeaking } = useSpeaking({ profile, triggerSyncIndicator });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    speaking: Loaded<typeof Speaking> | null;
  }>({
    isOpen: false,
    speaking: null,
  });

  const handleDeleteSpeaking = (speakingItem: Loaded<typeof Speaking>) => {
    setDeleteConfirmation({
      isOpen: true,
      speaking: speakingItem,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.speaking?.id) {
      deleteSpeaking(deleteConfirmation.speaking.id);
    }
    setDeleteConfirmation({ isOpen: false, speaking: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, speaking: null });
  };

  const handleClose = () => {
    onClose?.();
  };

  const getSpeakingDisplayName = (speakingItem: Loaded<typeof Speaking>) => {
    return speakingItem.title || 'Untitled Talk';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <SectionHeader
          title="Speaking"
          description="Share your speaking engagements and presentations."
          onActionClick={onAddSpeaking}
          actionText="Add Speaking"
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {(!speaking || speaking.length === 0) && (
          <div className="flex flex-col items-center py-20">
            <Button variant="ghost" size="sm" onClick={onAddSpeaking}>
              Add a speaking engagement you're proud of
            </Button>
          </div>
        )}

        {speaking && speaking.length > 0 && (
          <div className="space-y-6 pb-4">
            {speaking
              .filter(
                (speakingItem): speakingItem is Loaded<typeof Speaking> =>
                  speakingItem !== null,
              )
              .map((speakingItem) => (
                <SpeakingCard
                  key={speakingItem.id}
                  speaking={speakingItem}
                  onEdit={onEditSpeaking}
                  onDelete={handleDeleteSpeaking}
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
        title="Delete Speaking Engagement"
        description={
          deleteConfirmation.speaking ? (
            <>
              Are you sure you want to delete the speaking engagement{' '}
              <strong>
                {getSpeakingDisplayName(deleteConfirmation.speaking)}
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
