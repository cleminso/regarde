import { Loaded } from 'jazz-tools';

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

  const handleDeleteWorkExp = (workExp: Loaded<typeof WorkExp>) => {
    if (workExp.id) {
      deleteWorkExp(workExp.id);
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 bg-secondary">
        <SectionHeader
          title="Work Experience"
          description="Detail your roles and responsibilities."
          onActionClick={onAddWorkExp}
          actionText="Add Experience"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
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

      <div className="flex-shrink-0 bg-secondary">
        <EditorFooter
          primaryAction={{
            text: 'Done',
            onClick: handleClose,
          }}
        />
      </div>
    </div>
  );
}
