import { Loaded } from 'jazz-tools';

import {
  ListOfWriting,
  Writing,
  type CleanLoadedJazzAppProfile,
} from '../schema';

type UseWritingProps = {
  profile: CleanLoadedJazzAppProfile;
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

    if (
      writingData.title !== undefined &&
      writingToUpdate.title !== writingData.title
    ) {
      writingToUpdate.title = writingData.title;
      changed = true;
    }

    if (
      writingData.year !== undefined &&
      writingToUpdate.year !== writingData.year
    ) {
      writingToUpdate.year = writingData.year;
      changed = true;
    }

    if (writingData.hasOwnProperty('publisher')) {
      if (writingToUpdate.publisher !== writingData.publisher) {
        writingToUpdate.publisher = writingData.publisher;
        changed = true;
      }
    }

    if (writingData.hasOwnProperty('url')) {
      if (writingToUpdate.url !== writingData.url) {
        writingToUpdate.url = writingData.url;
        changed = true;
      }
    }

    if (writingData.hasOwnProperty('description')) {
      if (writingToUpdate.description !== writingData.description) {
        writingToUpdate.description = writingData.description;
        changed = true;
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
