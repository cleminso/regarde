import { Loaded } from 'jazz-tools';

import { logger } from '#/lib/utils/logger';
import { ListOfWriting, Writing } from '../schema';
import { BaseHookProps } from './types';

type UseWritingProps = BaseHookProps;

export function useWriting({ profile, triggerSyncIndicator }: UseWritingProps) {
  const ensureWritingList = (): Loaded<typeof ListOfWriting> | undefined => {
    if (!profile.$isLoaded) {
      logger.error('Profile is not loaded');
      return undefined;
    }

    if (profile.writing?.$isLoaded) {
      return profile.writing;
    }

    // Create new list if it doesn't exist
    const profileOwner = profile.$jazz.owner;
    if (!profileOwner?.$isLoaded) {
      logger.error('Cannot create writing list: profile owner is not loaded');
      return undefined;
    }

    const newWritingList = ListOfWriting.create([], { owner: profileOwner });
    profile.$jazz.set('writing', newWritingList);
    return newWritingList;
  };

  const addWriting = async (writingData: {
    title: string;
    year?: string;
    publisher?: string;
    url?: string;
    description?: string;
  }): Promise<Loaded<typeof Writing> | undefined> => {
    const writingList = ensureWritingList();
    if (!writingList?.$isLoaded) return undefined;

    const listOwner = writingList.$jazz.owner;
    if (!listOwner?.$isLoaded) {
      logger.error('Cannot create writing: list owner is not loaded');
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
    writingList.$jazz.push(newWriting);
    await triggerSyncIndicator(profile);
    return newWriting;
  };

  const updateWriting = async (
    writingToUpdate: Loaded<typeof Writing>,
    writingData: {
      title: string;
      year?: string;
      publisher?: string;
      url?: string;
      description?: string;
    },
  ) => {
    if (!writingToUpdate.$isLoaded) {
      logger.error('Writing instance not provided for update.');
      return;
    }

    let changed = false;

    if (
      writingData.title !== undefined &&
      writingToUpdate.title !== writingData.title
    ) {
      writingToUpdate.$jazz.set('title', writingData.title);
      changed = true;
    }

    if (
      writingData.year !== undefined &&
      writingToUpdate.year !== writingData.year
    ) {
      writingToUpdate.$jazz.set('year', writingData.year);
      changed = true;
    }

    if (writingData.hasOwnProperty('publisher')) {
      if (writingToUpdate.publisher !== writingData.publisher) {
        writingToUpdate.$jazz.set('publisher', writingData.publisher);
        changed = true;
      }
    }

    if (writingData.hasOwnProperty('url')) {
      if (writingToUpdate.url !== writingData.url) {
        writingToUpdate.$jazz.set('url', writingData.url);
        changed = true;
      }
    }

    if (writingData.hasOwnProperty('description')) {
      if (writingToUpdate.description !== writingData.description) {
        writingToUpdate.$jazz.set('description', writingData.description);
        changed = true;
      }
    }

    if (changed) {
      await triggerSyncIndicator(profile);
    }
  };

  const deleteWriting = async (writingId: string) => {
    if (!profile.$isLoaded) {
      logger.error('Profile is not loaded');
      return;
    }
    const writingList = profile.writing;
    if (!writingList?.$isLoaded) {
      logger.warn('No writing list to delete from or not loaded.');
      return;
    }
    const writingIndex = writingList.findIndex(
      (w: any) => w && w.$isLoaded && w.$jazz.id === writingId,
    );

    if (writingIndex !== -1) {
      writingList.$jazz.splice(writingIndex, 1);
      await triggerSyncIndicator(profile);
    } else {
      logger.error(`Writing with id ${writingId} not found for deletion.`);
    }
  };

  return {
    addWriting,
    updateWriting,
    deleteWriting,
  };
}
