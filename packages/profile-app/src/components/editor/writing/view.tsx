import { Loaded } from 'jazz-tools';
import { useState } from 'react';

import { Button, DestructiveConfirmationDialog } from '#/components/ui';
import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useWriting } from '#/lib/hook/useWriting.ts';
import { JazzAppProfile, ListOfWriting, Writing } from '#/lib/schema';
import { EditorFooter } from '../index';
import { SectionHeader } from './../layout/header';
import { WritingCard } from './card';

type WritingViewProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  writing: Loaded<typeof ListOfWriting> | undefined;
  onAddWriting: () => void;
  onEditWriting: (writing: Loaded<typeof Writing>) => void;
  onClose?: () => void;
};

export function WritingView({
  profile,
  triggerSyncIndicator,
  writing,
  onAddWriting,
  onEditWriting,
  onClose,
}: WritingViewProps) {
  const { deleteWriting } = useWriting({ profile, triggerSyncIndicator });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    writing: Loaded<typeof Writing> | null;
  }>({
    isOpen: false,
    writing: null,
  });

  const handleDeleteWriting = (writing: Loaded<typeof Writing>) => {
    setDeleteConfirmation({
      isOpen: true,
      writing,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.writing?.id) {
      deleteWriting(deleteConfirmation.writing.id);
    }
    setDeleteConfirmation({ isOpen: false, writing: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, writing: null });
  };

  const handleClose = () => {
    onClose?.();
  };

  const getWritingDisplayName = (writing: Loaded<typeof Writing>) => {
    return writing.title || 'Untitled Writing';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <SectionHeader
          title="Writing"
          description="Share your published articles, papers, and other."
          onActionClick={onAddWriting}
          actionText="Add Writing"
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {(!writing || writing.length === 0) && (
          <div className="flex flex-col items-center py-20">
            <Button variant="ghost" size="sm" onClick={onAddWriting}>
              Add an article or paper you've published
            </Button>
          </div>
        )}

        {writing && writing.length > 0 && (
          <div className="space-y-6 pb-4">
            {writing
              .filter(
                (writingItem): writingItem is Loaded<typeof Writing> =>
                  writingItem !== null,
              )
              .map((writingItem) => (
                <WritingCard
                  key={writingItem.id}
                  writing={writingItem}
                  onEdit={onEditWriting}
                  onDelete={handleDeleteWriting}
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
        title="Delete Writing"
        description={
          deleteConfirmation.writing ? (
            <>
              Are you sure you want to delete the writing{' '}
              <strong>
                {getWritingDisplayName(deleteConfirmation.writing)}
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
