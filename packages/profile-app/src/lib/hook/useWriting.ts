import { Loaded } from 'jazz-tools';

import { ListOfWriting, OnboardingProfile, Writing } from '../schema';

type UseWritingProps = {
  profile: Loaded<typeof OnboardingProfile>;
  triggerSyncIndicator: () => void;
};

export function useWriting({ profile, triggerSyncIndicator }: UseWritingProps) {
  const ensureWritingList = (): Loaded<typeof ListOfWriting> | undefined => {
    if (!profile.writing) {
      const profileOwner = profile._owner;
      if (!profileOwner) {
        console.error(
          'Cannot initialize writing list: profile._owner is undefined.',
        );
        return undefined;
      }

      profile.writing = ListOfWriting.create([], { owner: profileOwner });
    }
    return profile.writing;
  };

  const addWriting = (
    writingData: Writing,
  ): Loaded<typeof Writing> | undefined => {
    const writingList = ensureWritingList();
    if (!writingList) return undefined;

    const listOwner = writingList._owner;
    if (!listOwner) {
      console.error(
        'Cannot create a new writing instance: writingList._owner is undefined.',
      );
      return undefined;
    }
    const newWriting = Writing.create(
      {
        title: writingData.title,
        year: writingData.year,
        publisher: writingData.publisher,
        url: writingData.url,
        description: writingData.description,
      },
      { owner: listOwner },
    );
    writingList.push(newWriting);
    triggerSyncIndicator();
    return newWriting;
  };

  const updateWriting = (
    writingToUpdate: Loaded<typeof Writing>,
    writingData: Writing,
  ) => {
    if (!writingToUpdate) {
      console.error('Writing instance not provided for update.');
      return;
    }

    let changed = false;
    for (const key in writingData) {
      if (Object.prototype.hasOwnProperty.call(writingData, key)) {
        const field = key as keyof Writing;
        const currentValue =
          writingToUpdate[field as keyof Loaded<typeof Writing>];
        const newValue = writingData[field];

        if (field === 'title' || field === 'year') {
          if (typeof newValue === 'string' && currentValue !== newValue) {
            writingToUpdate[field as 'title' | 'year'] = newValue;
            changed = true;
          }
        } else {
          if (currentValue !== newValue) {
            writingToUpdate[field as 'publisher' | 'url' | 'description'] =
              newValue as string | undefined;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      triggerSyncIndicator();
    }
  };

  const deleteWriting = (writingId: string) => {
    const writingList = profile.writing;
    if (!writingList) {
      console.warn('No writing list to delete from.');
      return;
    }
    const writingIndex = writingList.findIndex(
      (w: any) => w && w.id === writingId,
    );

    if (writingIndex !== -1) {
      writingList.splice(writingIndex, 1);
      triggerSyncIndicator();
    } else {
      console.error(`Writing with id ${writingId} not found for deletion.`);
    }
  };

  return {
    addWriting,
    updateWriting,
    deleteWriting,
  };
}
