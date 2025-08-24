import { Loaded } from 'jazz-tools';
import { useState } from 'react';

import { Button, DestructiveConfirmationDialog } from '#/components/ui';
import { TriggerSyncIndicator } from '#/lib/hook/types';
import { useEducation } from '#/lib/hook/useEducation.ts';
import { Education, JazzAppProfile, ListOfEducation } from '#/lib/schema';
import { EditorFooter } from '../../index';
import { SectionHeader } from './../../layout/header';
import { EducationCard } from './card';

type EducationViewProps = {
  profile: Loaded<typeof JazzAppProfile>;
  triggerSyncIndicator: TriggerSyncIndicator;
  education: Loaded<typeof ListOfEducation> | undefined;
  onAddEducation: () => void;
  onEditEducation: (education: Loaded<typeof Education>) => void;
  onClose?: () => void;
};

export function EducationView({
  profile,
  triggerSyncIndicator,
  education,
  onAddEducation,
  onEditEducation,
  onClose,
}: EducationViewProps) {
  const { deleteEducation } = useEducation({ profile, triggerSyncIndicator });

  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    education: Loaded<typeof Education> | null;
  }>({
    isOpen: false,
    education: null,
  });

  const handleDeleteEducation = (education: Loaded<typeof Education>) => {
    setDeleteConfirmation({
      isOpen: true,
      education,
    });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.education?.id) {
      deleteEducation(deleteConfirmation.education.id);
    }
    setDeleteConfirmation({ isOpen: false, education: null });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, education: null });
  };

  const handleClose = () => {
    onClose?.();
  };

  const getEducationDisplayName = (education: Loaded<typeof Education>) => {
    return education.degree || 'Untitled Degree';
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0">
        <SectionHeader
          title="Education"
          description="Showcase your academic background and achievements."
          onActionClick={onAddEducation}
          actionText="Add Education"
        />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {(!education || education.length === 0) && (
          <div className="flex flex-col items-center py-20">
            <Button variant="ghost" size="sm" onClick={onAddEducation}>
              Add your educational background
            </Button>
          </div>
        )}

        {education && education.length > 0 && (
          <div className="space-y-6 pb-4">
            {education
              .filter((edu): edu is Loaded<typeof Education> => edu !== null)
              .map((edu) => (
                <EducationCard
                  key={edu.id}
                  education={edu}
                  onEdit={onEditEducation}
                  onDelete={handleDeleteEducation}
                />
              ))}
          </div>
        )}
      </div>

      <div className="flex-shrink-0y">
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
        title="Delete Education"
        description={
          deleteConfirmation.education ? (
            <>
              Are you sure you want to delete the education record{' '}
              <strong>
                {getEducationDisplayName(deleteConfirmation.education)}
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
